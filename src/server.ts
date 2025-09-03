import type { TFile } from "obsidian";
import type WebProxyLinkerPlugin from "./main";
import { openSearchWithQuery, tryOpenQuickSwitcher } from "./search";

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
        const bn = url.searchParams.get("bn");
        const heading = url.searchParams.get("h") || undefined;

        // 1) Resolve UID -> path
        let targetPath: string | undefined;
        if (uid) targetPath = indexer.getPathByUid(uid);
        // 2) Resolve local id -> path
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);
        // 3) Resolve basename -> path (single match)
        if (!targetPath && bn) {
          const matches = app.vault.getFiles().filter((f: TFile) => f.basename === bn);
          if (matches.length === 1) targetPath = matches[0].path;
          else if (matches.length > 1) {
            if (settings.basenamePreferQuickSwitcherPlus) {
              if (!tryOpenQuickSwitcher(app)) openSearchWithQuery(app, bn);
            } else {
              openSearchWithQuery(app, bn);
            }
            res.statusCode = 200; res.end(this.htmlOk("Multiple files match; opened Search.")); return;
          }
        }

        if (targetPath) {
          const vault = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs = `obsidian://open?vault=${vault}&file=${encodedPath}`;
          if (heading) obs += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs);
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        // 4) Fallback to raw `u` obsidian url
        if (u && /^obsidian:\/\//i.test(decodeURIComponent(u))) {
          shell.openExternal(decodeURIComponent(u));
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        res.statusCode = 404; res.end("Not found"); return;
      }

      if (url.pathname.startsWith("/v/")) {
        // Support resolving via uid/id/bn even on pretty URLs, before falling back to the path.
        const uid = url.searchParams.get("uid");
        const lid = url.searchParams.get("id");
        const bn = url.searchParams.get("bn");
        const heading = url.searchParams.get("h") || undefined;

        // Try UID
        let targetPath: string | undefined;
        if (uid) targetPath = indexer.getPathByUid(uid);
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);
        if (!targetPath && bn) {
          const matches = app.vault.getFiles().filter((f: TFile) => f.basename === bn);
          if (matches.length === 1) targetPath = matches[0].path;
          else if (matches.length > 1) {
            if (settings.basenameOpenSearchOnDuplicates) {
              if (settings.basenamePreferQuickSwitcherPlus) {
                if (!tryOpenQuickSwitcher(app)) openSearchWithQuery(app, bn);
              } else {
                openSearchWithQuery(app, bn);
              }
              res.statusCode = 200; res.end(this.htmlOk("Multiple files match; opened Search.")); return;
            }
          }
        }

        if (targetPath) {
          const vault = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs = `obsidian://open?vault=${vault}&file=${encodedPath}`;
          if (heading) obs += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs);
          res.statusCode = 200; res.end(this.htmlOk()); return;
        }

        // Fallback to the explicit pretty path
        const parts = url.pathname.split("/").slice(2);
        const vaultPart = parts.shift() || "";
        const filePath = parts.map((p) => decodeURIComponent(p)).join("/");
        const vault = decodeURIComponent(vaultPart);
        let obs = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(filePath)}`;
        if (heading) obs += `#${encodeURIComponent(heading)}`;
        shell.openExternal(obs);
        res.statusCode = 200; res.end(this.htmlOk()); return;
      }

      res.statusCode = 404; res.end("Not found");
    } catch (e) {
      console.error(e);
      res.statusCode = 500; res.end("Internal error");
    }
  }
}
