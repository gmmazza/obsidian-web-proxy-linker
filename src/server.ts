import { TFile } from "obsidian";
import type WebProxyLinkerPlugin from "./main";
import { openSearchWithQuery } from "./search";

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

export class IntegratedServer {
  private plugin: WebProxyLinkerPlugin;
  private server: any = null;
  constructor(plugin: WebProxyLinkerPlugin) { this.plugin = plugin; }

  start() {
    if (this.server) return;
    const http = getHttp();
    const shell = getShell();
    if (!http || !shell) {
      // Sandbox: no server
      return;
    }
    const { settings, app } = this.plugin;
    const port = settings.serverPort;
    const host = settings.listenHost || "127.0.0.1";
    this.server = http.createServer((req: any, res: any) => this.handleRequest(req, res, shell));
    this.server.on("error", (err: any) => {
      console.error("Proxy server error", err);
    });
    this.server.listen(port, host, () => {
      // Optionally notify through Obsidian Notice at plugin side
    });
  }

  stop() { if (!this.server) return; try { this.server.close(); } catch {} this.server = null; }

  private htmlOk(msg = "Opening in Obsidian… you can close this tab.") {
    return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">${msg}`;
  }

  private handleRequest(req: any, res: any, shell: any) {
    const { app, settings, indexer } = this.plugin;
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
        const uid = url.searchParams.get("uid");
        const lid = url.searchParams.get("id");
        const heading = url.searchParams.get("h") || undefined;

        const candidatePath = extractPathFromObsidianUrl(u);
        const basename = candidatePath ? getBasename(candidatePath) : undefined;

        // 1) UID / Local ID fast paths
        let targetPath: string | undefined = undefined;
        if (uid) targetPath = indexer.getPathByUid(uid);
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);

        // 2) Duplicate handling by basename (if we have one)
        if (!targetPath && basename) {
          const matches = app.vault.getFiles().filter((f: TFile) => f.basename === basename);
          if (matches.length > 1) { openSearchWithQuery(app, buildFileNameQuery(basename)); res.statusCode = 200; res.end(this.htmlOk("Multiple files match; opened Search.")); return; }
          if (matches.length === 1) targetPath = matches[0].path;
        }

        // 3) Prefer explicit candidatePath if it exists
        if (!targetPath && candidatePath) {
          const af = app.vault.getAbstractFileByPath(candidatePath);
          if (af && af instanceof TFile) {
            targetPath = candidatePath;
          } else {
            // If not found, but we have a basename, try to open Search with it
            if (basename) { openSearchWithQuery(app, buildFileNameQuery(basename)); res.statusCode = 200; res.end(this.htmlOk("File moved; opened Search.")); return; }
          }
        }

        // 4) Open resolved targetPath
        if (targetPath) {
          const vault = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs = `obsidian://open?vault=${vault}&file=${encodedPath}`;
          if (heading) obs += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs);
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        // 5) Fallback: raw obsidian:// in u
        if (u && /^obsidian:\/\//i.test(decodeURIComponent(u))) {
          shell.openExternal(decodeURIComponent(u));
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        res.statusCode = 404; res.end("Not found"); return;
      }

      if (url.pathname.startsWith("/v/")) {
        // Support resolving via uid/id even on pretty URLs, before falling back to the path.
        const uid = url.searchParams.get("uid");
        const lid = url.searchParams.get("id");
        const heading = url.searchParams.get("h") || undefined;

        // Extract explicit path from pretty URL
        const parts = url.pathname.split("/").slice(2);
        const vaultPart = parts.shift() || ""; // unused; current vault wins
        const filePath = parts.map((p) => decodeURIComponent(p)).join("/");
        const basename = getBasename(filePath);

        let targetPath: string | undefined = undefined;
        if (uid) targetPath = indexer.getPathByUid(uid);
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);

        if (!targetPath && basename) {
          const matches = app.vault.getFiles().filter((f: TFile) => f.basename === basename);
          if (matches.length > 1) { openSearchWithQuery(app, buildFileNameQuery(basename)); res.statusCode = 200; res.end(this.htmlOk("Multiple files match; opened Search.")); return; }
          if (matches.length === 1) targetPath = matches[0].path;
        }

        // Prefer the explicit pretty path if it exists
        if (!targetPath && filePath) {
          const af = app.vault.getAbstractFileByPath(filePath);
          if (af && af instanceof TFile) {
            targetPath = filePath;
          } else if (basename) { openSearchWithQuery(app, buildFileNameQuery(basename)); res.statusCode = 200; res.end(this.htmlOk("File moved; opened Search.")); return; }
        }

        if (targetPath) {
          const vault = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs = `obsidian://open?vault=${vault}&file=${encodedPath}`;
          if (heading) obs += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs);
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        res.statusCode = 404; res.end("Not found"); return;
      }

      res.statusCode = 404; res.end("Not found");
    } catch (e) {
      console.error(e);
      res.statusCode = 500; res.end("Internal error");
    }
  }
}

function extractPathFromObsidianUrl(u: string | undefined | null): string | undefined {
  if (!u) return undefined;
  let s: string;
  try { s = decodeURIComponent(u); } catch { s = u; }
  if (!/^obsidian:\/\//i.test(s)) return undefined;
  try {
    const url = new URL(s);
    const fp = url.searchParams.get("file");
    if (!fp) return undefined;
    try { return decodeURIComponent(fp); } catch { return fp; }
  } catch { return undefined; }
}

function getBasename(p: string): string {
  const name = p.split("/").pop() || p;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function buildFileNameQuery(basename: string): string {
  const q = basename.replace(/"/g, '\\"');
  return `file:"${q}"`;
}
