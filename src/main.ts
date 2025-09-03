import type { Editor } from "obsidian";
import { App, MarkdownView, Menu, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

// === Helpers para que el plugin funcione en sandbox y fuera de sandbox ===
function getNodeRequire(): any {
  const w = window as any;
  return typeof w.require === "function" ? w.require : null;
}
function getHttp(): any | null {
  const req = getNodeRequire();
  if (!req) return null;
  try { return req("http"); } catch { return null; }
}
function getShell(): any | null {
  const req = getNodeRequire();
  if (!req) return null;
  try { return req("electron").shell; } catch { return null; }
}

interface ProxyLinkerSettings {
  // Generación de enlaces
  routeStyle: "query" | "pretty";
  addHeadingAnchor: boolean;
  vaultNameOverride: string;
  baseUrl: string; // sólo si no usamos servidor integrado
  // Servidor integrado
  useIntegratedServer: boolean;
  serverPort: number;
  listenHost: string; // 127.0.0.1
}

const DEFAULT_SETTINGS: ProxyLinkerSettings = {
  routeStyle: "query",
  addHeadingAnchor: true,
  vaultNameOverride: "",
  baseUrl: "http://127.0.0.1:27124",
  useIntegratedServer: true,
  serverPort: 27124,
  listenHost: "127.0.0.1"
};

export default class WebProxyLinkerPlugin extends Plugin {
  settings: ProxyLinkerSettings = DEFAULT_SETTINGS;
  private server: any = null;

  async onload() {
    await this.loadSettings();

    // UI
    this.addRibbonIcon("link", "Copiar enlace web‑proxy de la nota actual", async () => {
      const f = this.app.workspace.getActiveFile();
      if (!f) return new Notice("No hay nota activa");
      await this.copyForFile(f, true);
    });

    this.addCommand({
      id: "copy-proxy-link-current",
      name: "Copiar enlace web‑proxy de la nota actual",
      editorCheckCallback: (checking, editor, view) => {
        const f = this.app.workspace.getActiveFile();
        if (!f) return false;
        if (!checking) this.copyForFile(f, true);
        return true;
      }
    });

    this.addCommand({
      id: "insert-proxy-link-current",
      name: "Insertar enlace web‑proxy en el editor",
      editorCheckCallback: (checking, editor, view) => {
        const f = this.app.workspace.getActiveFile();
        if (!f) return false;
        if (!checking) this.insertLinkInEditor(f, editor as Editor);
        return true;
      }
    });

    this.registerEvent(this.app.workspace.on("file-menu", (menu: Menu, file) => {
      if (file instanceof TFile) {
        menu.addItem((item) =>
          item.setTitle("Copiar enlace web‑proxy").setIcon("link").onClick(() => this.copyForFile(file, false))
        );
      }
    }));

    this.addSettingTab(new ProxyLinkerSettingTab(this.app, this));

    // Servidor integrado (sólo si hay Node/Electron)
    if (this.settings.useIntegratedServer) this.startServer();
  }

  onunload() { this.stopServer(); }

  // === Servidor integrado ===
  private startServer() {
    if (this.server) return;

    const http = getHttp();
    const shell = getShell();
    if (!http || !shell) {
      new Notice("Web Proxy Linker: servidor integrado desactivado (sandbox activo). Usa proxy externo o desactiva el sandbox.");
      return;
    }

    const port = this.settings.serverPort;
    const host = this.settings.listenHost || "127.0.0.1";

    this.server = http.createServer((req: any, res: any) => this.handleRequest(req, res, shell));

    this.server.on("error", (err: any) => {
      console.error("Proxy server error", err);
      new Notice(`Web Proxy Linker: error al iniciar el servidor (${err?.code || err}).`);
    });

    this.server.listen(port, host, () => {
      new Notice(`Web Proxy Linker: servidor en http://${host}:${port}`);
    });
  }

  private stopServer() {
    if (!this.server) return;
    try { this.server.close(); } catch {}
    this.server = null;
  }

  private htmlOk(msg = "Abriendo en Obsidian… ya puedes cerrar esta pestaña.") {
    return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">${msg}`;
  }

  private handleRequest(req: any, res: any, shell: any) {
    try {
      const hostHeader = req.headers["host"] || "127.0.0.1";
      const url = new URL(req.url || "/", `http://${hostHeader}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Type", "text/html; charset=utf-8");

      if (url.pathname === "/ping" || url.pathname === "/health") {
        res.statusCode = 200; res.end(this.htmlOk("OK")); return;
      }

      if (url.pathname === "/open") {
        const u = url.searchParams.get("u") || "";
        const decoded = decodeURIComponent(u);
        if (!/^obsidian:\/\//i.test(decoded)) { res.statusCode = 400; res.end("URL no válida (se requiere obsidian://)"); return; }
        shell.openExternal(decoded);
        res.statusCode = 200; res.end(this.htmlOk()); return;
      }

      if (url.pathname.startsWith("/v/")) {
        const parts = url.pathname.split("/").slice(2);
        const vaultPart = parts.shift() || "";
        const vault = decodeURIComponent(vaultPart);
        const filePath = parts.map((p) => decodeURIComponent(p)).join("/");
        const heading = url.searchParams.get("h") || undefined;
        let obs = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(filePath)}`;
        if (heading) obs += `#${encodeURIComponent(heading)}`;
        shell.openExternal(obs);
        res.statusCode = 200; res.end(this.htmlOk()); return;
      }

      res.statusCode = 404; res.end("No encontrado");
    } catch (e) {
      console.error(e);
      res.statusCode = 500; res.end("Error interno");
    }
  }

  // === Generación de enlaces ===
  private sanitizeBase(base: string): string { return base.replace(/\/+$/, ""); }
  private getVaultName(): string { return (this.settings.vaultNameOverride?.trim() || this.app.vault.getName()); }

  private buildObsidianUrl(file: TFile, heading?: string): string {
    const vault = encodeURIComponent(this.getVaultName());
    const encodedPath = encodeURIComponent(file.path);
    let url = `obsidian://open?vault=${vault}&file=${encodedPath}`;
    if (heading) url += `#${encodeURIComponent(heading)}`;
    return url;
  }

  private getBaseUrl(): string {
    if (this.settings.useIntegratedServer) {
      const host = this.settings.listenHost || "127.0.0.1";
      return `http://${host}:${this.settings.serverPort}`;
    } else {
      return this.sanitizeBase(this.settings.baseUrl || "http://127.0.0.1:27124");
    }
  }

  private buildProxyUrl(file: TFile, heading?: string): string {
    const base = this.getBaseUrl();
    if (this.settings.routeStyle === "pretty") {
      const vault = encodeURIComponent(this.getVaultName());
      const prettyPath = file.path.split("/").map(encodeURIComponent).join("/");
      const query = heading ? `?h=${encodeURIComponent(heading)}` : "";
      return `${base}/v/${vault}/${prettyPath}${query}`;
    } else {
      const inner = this.buildObsidianUrl(file, heading);
      return `${base}/open?u=${encodeURIComponent(inner)}`;
    }
  }

  private getHeadingFromEditorIfAny(forFile: TFile): string | undefined {
    if (!this.settings.addHeadingAnchor) return undefined;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return undefined;
    if (view.file?.path !== forFile.path) return undefined;
    const editor = view.editor;
    const cur = editor.getCursor().line;
    for (let i = cur; i >= 0; i--) {
      const line = editor.getLine(i);
      const m = /^\s*#+\s+(.+)$/.exec(line);
      if (m) return m[1].trim();
    }
    return undefined;
  }

  private async copyForFile(file: TFile, useHeadingFromEditor: boolean) {
    const heading = useHeadingFromEditor ? this.getHeadingFromEditorIfAny(file) : undefined;
    const url = this.buildProxyUrl(file, heading);
    const ok = await this.copyToClipboard(url);
    new Notice(ok ? "Enlace copiado al portapapeles" : url);
  }

  private async insertLinkInEditor(file: TFile, editor: Editor) {
    const heading = this.getHeadingFromEditorIfAny(file);
    const url = this.buildProxyUrl(file, heading);
    const title = file.basename + (heading ? ` — ${heading}` : "");
    const md = `[${title}](${url})`;
    editor.replaceSelection(md);
    new Notice("Enlace insertado");
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { try { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return true; } catch { return false; } }
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.settings.useIntegratedServer) { this.stopServer(); this.startServer(); }
    else { this.stopServer(); }
  }
}

class ProxyLinkerSettingTab extends PluginSettingTab {
  plugin: WebProxyLinkerPlugin;
  constructor(app: App, plugin: WebProxyLinkerPlugin) { super(app, plugin); this.plugin = plugin; }
  display(): void {
    const { containerEl } = this; containerEl.empty(); containerEl.createEl("h2", { text: "Web Proxy Linker" });

    new Setting(containerEl)
      .setName("Usar servidor integrado")
      .setDesc("Levanta http://127.0.0.1:<puerto>. Si estás en sandbox, se desactivará solo.")
      .addToggle((t) => t.setValue(this.plugin.settings.useIntegratedServer).onChange(async (v) => { this.plugin.settings.useIntegratedServer = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Puerto del servidor")
      .setDesc("Por defecto 27124")
      .addText((t) => t.setPlaceholder("27124").setValue(String(this.plugin.settings.serverPort)).onChange(async (v) => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0 && n < 65536) this.plugin.settings.serverPort = n; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Host a escuchar")
      .setDesc("Usa 127.0.0.1 para no exponerlo fuera de tu equipo")
      .addText((t) => t.setPlaceholder("127.0.0.1").setValue(this.plugin.settings.listenHost).onChange(async (v) => { this.plugin.settings.listenHost = (v || "127.0.0.1").trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Base URL del proxy (externo)")
      .setDesc("Sólo se usa si el servidor integrado está OFF")
      .addText((t) => t.setPlaceholder("http://localhost:27124").setValue(this.plugin.settings.baseUrl).onChange(async (v) => { this.plugin.settings.baseUrl = v.trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Estilo de ruta")
      .setDesc("'query' usa /open?u=..., 'pretty' usa /v/<Vault>/<ruta>?h=Heading")
      .addDropdown((d) => d.addOptions({ query: "query", pretty: "pretty" }).setValue(this.plugin.settings.routeStyle).onChange(async (v: "query" | "pretty") => { this.plugin.settings.routeStyle = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Usar heading actual si existe")
      .setDesc("Añade automáticamente el encabezado según la posición del cursor")
      .addToggle((t) => t.setValue(this.plugin.settings.addHeadingAnchor).onChange(async (v) => { this.plugin.settings.addHeadingAnchor = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName("Nombre de vault (opcional)")
      .setDesc("Déjalo vacío para usar el nombre real del vault")
      .addText((t) => t.setPlaceholder("MiVault").setValue(this.plugin.settings.vaultNameOverride).onChange(async (v) => { this.plugin.settings.vaultNameOverride = v.trim(); await this.plugin.saveSettings(); }));
  }
}