import type { Editor } from "obsidian";
import { App, MarkdownView, Menu, Notice, Plugin, TFile } from "obsidian";
import { ProxyLinkerSettingTab } from "./settingsTab";
import { DEFAULT_SETTINGS, type ProxyLinkerSettings, type PluginDataShapeV2 } from "./settings";
import { IndexManager } from "./indexer";
import { IntegratedServer } from "./server";
import { buildProxyUrl } from "./linkBuilder";

export default class WebProxyLinkerPlugin extends Plugin {
  settings: ProxyLinkerSettings = DEFAULT_SETTINGS;
  indexer!: IndexManager;
  registry: Record<string, string> = {};
  server: IntegratedServer | null = null;

  async onload() {
    await this.loadSettings();

    // Index manager
    this.indexer = new IndexManager(this.app, this.settings, this);
    this.indexer.rebuildAll();

    // Events to keep indices updated
    this.registerEvent(this.app.metadataCache.on('changed', (file) => {
      if (file instanceof TFile) this.indexer.onFrontmatterChanged(file);
    }));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      if (file instanceof TFile) this.indexer.onFileRenamed(oldPath, file);
    }));
    this.registerEvent(this.app.vault.on('delete', (file) => {
      if (file instanceof TFile) this.indexer.onFileDeleted(file.path);
    }));

    // UI
    this.addRibbonIcon("link", "Copy web-proxy link of current note", async () => {
      const f = this.app.workspace.getActiveFile();
      if (!f) return new Notice("No active note");
      await this.copyForFile(f, true);
    });

    this.addCommand({
      id: "copy-proxy-link-current",
      name: "Copy web-proxy link of current note",
      editorCheckCallback: (checking, editor, view) => {
        const f = this.app.workspace.getActiveFile();
        if (!f) return false;
        if (!checking) this.copyForFile(f, true);
        return true;
      }
    });

    this.addCommand({
      id: "insert-proxy-link-current",
      name: "Insert web-proxy link into editor",
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
          item.setTitle("Copy web-proxy link").setIcon("link").onClick(() => this.copyForFile(file, false))
        );
      }
    }));

    this.addSettingTab(new ProxyLinkerSettingTab(this.app, this));

    if (this.settings.useIntegratedServer) this.startServer();
  }

  onunload() { this.stopServer(); }

  private startServer() {
    if (this.server) return;
    this.server = new IntegratedServer(this);
    this.server.start();
    if (!this.settings.useIntegratedServer) return;
    new Notice(`Web Proxy Linker: server ${this.settings.listenHost}:${this.settings.serverPort}`);
  }

  private stopServer() { if (this.server) { this.server.stop(); this.server = null; } }

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
    const url = await buildProxyUrl(this.app, this.settings, this.indexer, file, heading);
    const ok = await this.copyToClipboard(url);
    new Notice(ok ? "Link copied to clipboard" : url);
  }

  private async insertLinkInEditor(file: TFile, editor: Editor) {
    const heading = this.getHeadingFromEditorIfAny(file);
    const url = await buildProxyUrl(this.app, this.settings, this.indexer, file, heading);
    const title = file.basename + (heading ? ` — ${heading}` : "");
    const md = `[${title}](${url})`;
    editor.replaceSelection(md);
    new Notice("Link inserted");
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { try { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return true; } catch { return false; } }
  }

  async loadSettings() {
    const raw = await this.loadData();
    if (!raw) {
      this.settings = { ...DEFAULT_SETTINGS };
      this.registry = {};
      return;
    }
    // Backward compat: old versions stored settings directly
    if (raw && (raw as any).routeStyle) {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, raw as any);
      this.registry = {};
    } else {
      const d = raw as PluginDataShapeV2;
      this.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
      this.registry = d.registry || {};
    }
  }

  async saveSettings() {
    const data: PluginDataShapeV2 = { settings: this.settings, registry: this.registry };
    await this.saveData(data);
    if (this.settings.useIntegratedServer) { this.stopServer(); this.startServer(); }
    else { this.stopServer(); }
  }
}

