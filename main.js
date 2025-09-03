"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WebProxyLinkerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/settingsTab.ts
var import_obsidian = require("obsidian");
var ProxyLinkerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Web Proxy Linker" });
    new import_obsidian.Setting(containerEl).setName("Use integrated server").setDesc("Starts http://127.0.0.1:<port>. If sandboxed, it will auto-disable.").addToggle(
      (t) => t.setValue(this.plugin.settings.useIntegratedServer).onChange(async (v) => {
        this.plugin.settings.useIntegratedServer = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Server port").setDesc("Default 27124").addText(
      (t) => t.setPlaceholder("27124").setValue(String(this.plugin.settings.serverPort)).onChange(async (v) => {
        const n = parseInt(v, 10);
        if (!isNaN(n) && n > 0 && n < 65536) this.plugin.settings.serverPort = n;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Listen host").setDesc("Use 127.0.0.1 to keep it local only").addText(
      (t) => t.setPlaceholder("127.0.0.1").setValue(this.plugin.settings.listenHost).onChange(async (v) => {
        this.plugin.settings.listenHost = (v || "127.0.0.1").trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("External proxy Base URL").setDesc("Only used if integrated server is OFF").addText(
      (t) => t.setPlaceholder("http://localhost:27124").setValue(this.plugin.settings.baseUrl).onChange(async (v) => {
        this.plugin.settings.baseUrl = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Route style").setDesc("'query' uses /open?u=..., 'pretty' uses /v/<Vault>/<path>?h=Heading").addDropdown(
      (d) => d.addOptions({ query: "query", pretty: "pretty" }).setValue(this.plugin.settings.routeStyle).onChange(async (v) => {
        this.plugin.settings.routeStyle = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Add current heading if available").setDesc("Automatically add heading anchor based on the cursor position").addToggle(
      (t) => t.setValue(this.plugin.settings.addHeadingAnchor).onChange(async (v) => {
        this.plugin.settings.addHeadingAnchor = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Vault name override (optional)").setDesc("Leave empty to use the vault's real name").addText(
      (t) => t.setPlaceholder("MyVault").setValue(this.plugin.settings.vaultNameOverride).onChange(async (v) => {
        this.plugin.settings.vaultNameOverride = v.trim();
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "Linking strategy" });
    new import_obsidian.Setting(containerEl).setName("Strategy").setDesc("Choose how links stay stable when files move").addDropdown(
      (d) => d.addOptions({
        "path": "Path (current behavior)",
        "frontmatter-uid": "Frontmatter UID",
        "local-registry": "Local registry (no file changes)",
        "basename": "Basename (search on duplicates)"
      }).setValue(this.plugin.settings.linkStrategy).onChange(async (v) => {
        this.plugin.settings.linkStrategy = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("On duplicates: open Search").setDesc("If multiple files share the same basename, open Search with the query").addToggle(
      (t) => t.setValue(this.plugin.settings.basenameOpenSearchOnDuplicates).onChange(async (v) => {
        this.plugin.settings.basenameOpenSearchOnDuplicates = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Prefer QuickSwitcher++ on duplicates").setDesc("If installed, try to open Quick Switcher++ instead of Search (query cannot be prefilled)").addToggle(
      (t) => t.setValue(this.plugin.settings.basenamePreferQuickSwitcherPlus).onChange(async (v) => {
        this.plugin.settings.basenamePreferQuickSwitcherPlus = v;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "Frontmatter UID" });
    new import_obsidian.Setting(containerEl).setName("Use Note UID Generator compatibility").setDesc("Respect the same YAML key if that plugin is present").addToggle(
      (t) => t.setValue(this.plugin.settings.useNoteUidCompat).onChange(async (v) => {
        this.plugin.settings.useNoteUidCompat = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Preferred YAML key").setDesc("Key used to read/write UID in frontmatter").addText(
      (t) => t.setPlaceholder("uid").setValue(this.plugin.settings.frontmatterUidKeyPreferred).onChange(async (v) => {
        this.plugin.settings.frontmatterUidKeyPreferred = (v || "uid").trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Also recognize keys").setDesc("Comma-separated list (e.g. uid,note_uid,noteId,id)").addText(
      (t) => t.setPlaceholder("uid,note_uid,noteId,id").setValue(this.plugin.settings.frontmatterUidKeys.join(",")).onChange(async (v) => {
        this.plugin.settings.frontmatterUidKeys = (v || "").split(",").map((s) => s.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Auto-assign UID if missing").setDesc("Assign a UID on first use if the note has none").addToggle(
      (t) => t.setValue(this.plugin.settings.autoAssignUid).onChange(async (v) => {
        this.plugin.settings.autoAssignUid = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("UID format").setDesc("Default uuid-v4; nanoid-21 is compact; timestamp-rand is sortable").addDropdown(
      (d) => d.addOptions({ "uuid-v4": "uuid-v4", "nanoid-21": "nanoid-21", "timestamp-rand": "timestamp-rand" }).setValue(this.plugin.settings.uidFormat).onChange(async (v) => {
        this.plugin.settings.uidFormat = v;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  routeStyle: "query",
  addHeadingAnchor: true,
  vaultNameOverride: "",
  baseUrl: "http://127.0.0.1:27124",
  useIntegratedServer: true,
  serverPort: 27124,
  listenHost: "127.0.0.1",
  linkStrategy: "path",
  useNoteUidCompat: true,
  noteUidPluginId: null,
  frontmatterUidKeys: ["uid", "note_uid", "noteId", "id"],
  frontmatterUidKeyPreferred: "uid",
  autoAssignUid: false,
  uidFormat: "uuid-v4",
  basenameOpenSearchOnDuplicates: true,
  basenamePreferQuickSwitcherPlus: false
};
function sanitizeBase(base) {
  return base.replace(/\/+$/, "");
}
function getVaultName(app, settings) {
  var _a;
  return ((_a = settings.vaultNameOverride) == null ? void 0 : _a.trim()) || app.vault.getName();
}
function getBaseUrl(settings) {
  if (settings.useIntegratedServer) {
    const host = settings.listenHost || "127.0.0.1";
    return `http://${host}:${settings.serverPort}`;
  } else {
    return sanitizeBase(settings.baseUrl || "http://127.0.0.1:27124");
  }
}

// src/uid.ts
function getUidFromFrontmatter(app, file, keys) {
  var _a;
  const fm = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  if (!fm) return void 0;
  for (const k of keys) {
    const v = fm[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return void 0;
}
async function ensureUidForFile(app, file, settings) {
  let uid = getUidFromFrontmatter(app, file, [settings.frontmatterUidKeyPreferred, ...settings.frontmatterUidKeys]);
  if (uid) return uid;
  if (!settings.autoAssignUid) return void 0;
  uid = generateUid(settings.uidFormat);
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      fm[settings.frontmatterUidKeyPreferred] = uid;
    });
    return uid;
  } catch (e) {
    return void 0;
  }
}
function generateUid(fmt) {
  if (fmt === "uuid-v4") return uuidv4();
  if (fmt === "nanoid-21") return nanoid21();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
}
function uuidv4() {
  var _a;
  const g = globalThis;
  if ((_a = g.crypto) == null ? void 0 : _a.getRandomValues) {
    const b = new Uint8Array(16);
    g.crypto.getRandomValues(b);
    b[6] = b[6] & 15 | 64;
    b[8] = b[8] & 63 | 128;
    const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  let s = "";
  for (let i = 0; i < 36; i++) s += "x";
  return s.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function nanoid21() {
  var _a;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
  const g = globalThis;
  const buf = new Uint8Array(21);
  if ((_a = g.crypto) == null ? void 0 : _a.getRandomValues) g.crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = Math.random() * 256 | 0;
  let id = "";
  for (let i = 0; i < buf.length; i++) id += alphabet[buf[i] & 63];
  return id;
}

// src/indexer.ts
var IndexManager = class {
  constructor(app, settings, plugin) {
    // uid (frontmatter) -> path
    this.uidIndex = /* @__PURE__ */ new Map();
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
  }
  rebuildAll() {
    this.uidIndex.clear();
    const files = this.app.vault.getFiles();
    for (const f of files) {
      const uid = getUidFromFrontmatter(this.app, f, [this.settings.frontmatterUidKeyPreferred, ...this.settings.frontmatterUidKeys]);
      if (uid) this.uidIndex.set(uid, f.path);
    }
  }
  // Frontmatter UID
  getPathByUid(uid) {
    if (!uid) return void 0;
    return this.uidIndex.get(uid);
  }
  onFrontmatterChanged(file) {
    const uid = getUidFromFrontmatter(this.app, file, [this.settings.frontmatterUidKeyPreferred, ...this.settings.frontmatterUidKeys]);
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === file.path) this.uidIndex.delete(k);
    }
    if (uid) this.uidIndex.set(uid, file.path);
  }
  onFileRenamed(oldPath, file) {
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === oldPath) this.uidIndex.set(k, file.path);
    }
    for (const [id, p] of Object.entries(this.plugin.registry)) {
      if (p === oldPath) this.plugin.registry[id] = file.path;
    }
  }
  onFileDeleted(path) {
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === path) this.uidIndex.delete(k);
    }
    for (const [id, p] of Object.entries(this.plugin.registry)) {
      if (p === path) delete this.plugin.registry[id];
    }
  }
  // Local registry
  getPathByLocalId(id) {
    if (!id) return void 0;
    return this.plugin.registry[id];
  }
  ensureLocalIdForPath(path) {
    for (const [id2, p] of Object.entries(this.plugin.registry)) {
      if (p === path) return id2;
    }
    const id = this.makeLocalId();
    this.plugin.registry[id] = path;
    return id;
  }
  makeLocalId() {
    const rand = Math.random().toString(36).slice(2, 10);
    const t = Date.now().toString(36);
    return `${t}-${rand}`;
  }
};

// src/search.ts
function openSearchWithQuery(app, q) {
  const leaves = app.workspace.getLeavesOfType("search");
  const leaf = leaves[0] || app.workspace.getRightLeaf(false);
  leaf.setViewState({ type: "search", state: { query: q } });
  app.workspace.revealLeaf(leaf);
}
function tryOpenQuickSwitcher(app) {
  var _a;
  const cmds = (_a = app.commands) == null ? void 0 : _a.commands;
  if (!cmds) return false;
  const candidates = [
    // Your QuickSwitcher++ (Darlal) specific ids
    "darlal-switcher-plus:switcher-plus:open",
    "darlal-switcher-plus:switcher-plus:open-editors",
    // Quick Switcher++ (unknown exact id; try common patterns)
    "quick-switcher-plus:open",
    "switcher-plus:open",
    "obsidian-quick-switcher-plus:open",
    // Fallback to Obsidian built-in switcher
    "switcher:open"
  ];
  for (const id of candidates) {
    if (cmds[id]) {
      app.commands.executeCommandById(id);
      return true;
    }
  }
  if (cmds["switcher:open"]) {
    app.commands.executeCommandById("switcher:open");
    return true;
  }
  return false;
}

// src/server.ts
function getNodeRequire() {
  const w = window;
  return typeof w.require === "function" ? w.require : null;
}
function getHttp() {
  const req = getNodeRequire();
  if (!req) return null;
  try {
    return req("http");
  } catch (e) {
    return null;
  }
}
function getShell() {
  const req = getNodeRequire();
  if (!req) return null;
  try {
    return req("electron").shell;
  } catch (e) {
    return null;
  }
}
var IntegratedServer = class {
  constructor(plugin) {
    this.server = null;
    this.plugin = plugin;
  }
  start() {
    if (this.server) return;
    const http = getHttp();
    const shell = getShell();
    if (!http || !shell) {
      return;
    }
    const { settings, app } = this.plugin;
    const port = settings.serverPort;
    const host = settings.listenHost || "127.0.0.1";
    this.server = http.createServer((req, res) => this.handleRequest(req, res, shell));
    this.server.on("error", (err) => {
      console.error("Proxy server error", err);
    });
    this.server.listen(port, host, () => {
    });
  }
  stop() {
    if (!this.server) return;
    try {
      this.server.close();
    } catch (e) {
    }
    this.server = null;
  }
  htmlOk(msg = "Opening in Obsidian\u2026 you can close this tab.") {
    return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">${msg}`;
  }
  handleRequest(req, res, shell) {
    const { app, settings, indexer } = this.plugin;
    try {
      const hostHeader = req.headers["host"] || "127.0.0.1";
      const url = new URL(req.url || "/", `http://${hostHeader}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (url.pathname === "/ping" || url.pathname === "/health") {
        res.statusCode = 200;
        res.end(this.htmlOk("OK"));
        return;
      }
      if (url.pathname === "/open") {
        const u = url.searchParams.get("u") || "";
        const uid = url.searchParams.get("uid");
        const lid = url.searchParams.get("id");
        const bn = url.searchParams.get("bn");
        const heading = url.searchParams.get("h") || void 0;
        let targetPath;
        if (uid) targetPath = indexer.getPathByUid(uid);
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);
        if (!targetPath && bn) {
          const matches = app.vault.getFiles().filter((f) => f.basename === bn);
          if (matches.length === 1) targetPath = matches[0].path;
          else if (matches.length > 1) {
            if (settings.basenamePreferQuickSwitcherPlus) {
              if (!tryOpenQuickSwitcher(app)) openSearchWithQuery(app, bn);
            } else {
              openSearchWithQuery(app, bn);
            }
            res.statusCode = 200;
            res.end(this.htmlOk("Multiple files match; opened Search."));
            return;
          }
        }
        if (targetPath) {
          const vault = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs = `obsidian://open?vault=${vault}&file=${encodedPath}`;
          if (heading) obs += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs);
          res.statusCode = 200;
          res.end(this.htmlOk());
          return;
        }
        if (u && /^obsidian:\/\//i.test(decodeURIComponent(u))) {
          shell.openExternal(decodeURIComponent(u));
          res.statusCode = 200;
          res.end(this.htmlOk());
          return;
        }
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      if (url.pathname.startsWith("/v/")) {
        const uid = url.searchParams.get("uid");
        const lid = url.searchParams.get("id");
        const bn = url.searchParams.get("bn");
        const heading = url.searchParams.get("h") || void 0;
        let targetPath;
        if (uid) targetPath = indexer.getPathByUid(uid);
        if (!targetPath && lid) targetPath = indexer.getPathByLocalId(lid);
        if (!targetPath && bn) {
          const matches = app.vault.getFiles().filter((f) => f.basename === bn);
          if (matches.length === 1) targetPath = matches[0].path;
          else if (matches.length > 1) {
            if (settings.basenameOpenSearchOnDuplicates) {
              if (settings.basenamePreferQuickSwitcherPlus) {
                if (!tryOpenQuickSwitcher(app)) openSearchWithQuery(app, bn);
              } else {
                openSearchWithQuery(app, bn);
              }
              res.statusCode = 200;
              res.end(this.htmlOk("Multiple files match; opened Search."));
              return;
            }
          }
        }
        if (targetPath) {
          const vault2 = encodeURIComponent(app.vault.getName());
          const encodedPath = encodeURIComponent(targetPath);
          let obs2 = `obsidian://open?vault=${vault2}&file=${encodedPath}`;
          if (heading) obs2 += `#${encodeURIComponent(heading)}`;
          shell.openExternal(obs2);
          res.statusCode = 200;
          res.end(this.htmlOk());
          return;
        }
        const parts = url.pathname.split("/").slice(2);
        const vaultPart = parts.shift() || "";
        const filePath = parts.map((p) => decodeURIComponent(p)).join("/");
        const vault = decodeURIComponent(vaultPart);
        let obs = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(filePath)}`;
        if (heading) obs += `#${encodeURIComponent(heading)}`;
        shell.openExternal(obs);
        res.statusCode = 200;
        res.end(this.htmlOk());
        return;
      }
      res.statusCode = 404;
      res.end("Not found");
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end("Internal error");
    }
  }
};

// src/linkBuilder.ts
function buildObsidianUrl(app, settings, file, heading) {
  const vault = encodeURIComponent(getVaultName(app, settings));
  const encodedPath = encodeURIComponent(file.path);
  let url = `obsidian://open?vault=${vault}&file=${encodedPath}`;
  if (heading) url += `#${encodeURIComponent(heading)}`;
  return url;
}
async function buildProxyUrl(app, settings, indexer, file, heading) {
  const base = getBaseUrl(settings);
  const inner = buildObsidianUrl(app, settings, file, heading);
  const hq = heading ? `&h=${encodeURIComponent(heading)}` : "";
  switch (settings.linkStrategy) {
    case "frontmatter-uid": {
      const uid = await ensureUidForFile(app, file, settings);
      if (settings.routeStyle === "pretty") {
        return `${base}/v/${encodeURIComponent(getVaultName(app, settings))}/${file.path.split("/").map(encodeURIComponent).join("/")}?uid=${encodeURIComponent(uid || "")}${hq}`;
      } else {
        return `${base}/open?uid=${encodeURIComponent(uid || "")}&u=${encodeURIComponent(inner)}${hq}`;
      }
    }
    case "local-registry": {
      const id = indexer.ensureLocalIdForPath(file.path);
      if (settings.routeStyle === "pretty") {
        return `${base}/v/${encodeURIComponent(getVaultName(app, settings))}/${file.path.split("/").map(encodeURIComponent).join("/")}?id=${encodeURIComponent(id)}${hq}`;
      } else {
        return `${base}/open?id=${encodeURIComponent(id)}&u=${encodeURIComponent(inner)}${hq}`;
      }
    }
    case "basename": {
      const bn = file.basename;
      if (settings.routeStyle === "pretty") {
        return `${base}/v/${encodeURIComponent(getVaultName(app, settings))}/${file.path.split("/").map(encodeURIComponent).join("/")}?bn=${encodeURIComponent(bn)}${hq}`;
      } else {
        return `${base}/open?bn=${encodeURIComponent(bn)}&u=${encodeURIComponent(inner)}${hq}`;
      }
    }
    case "path":
    default: {
      if (settings.routeStyle === "pretty") {
        const query = heading ? `?h=${encodeURIComponent(heading)}` : "";
        return `${base}/v/${encodeURIComponent(getVaultName(app, settings))}/${file.path.split("/").map(encodeURIComponent).join("/")}${query}`;
      } else {
        return `${base}/open?u=${encodeURIComponent(inner)}`;
      }
    }
  }
}

// src/main.ts
var WebProxyLinkerPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.registry = {};
    this.server = null;
  }
  async onload() {
    await this.loadSettings();
    this.indexer = new IndexManager(this.app, this.settings, this);
    this.indexer.rebuildAll();
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      if (file instanceof import_obsidian2.TFile) this.indexer.onFrontmatterChanged(file);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof import_obsidian2.TFile) this.indexer.onFileRenamed(oldPath, file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof import_obsidian2.TFile) this.indexer.onFileDeleted(file.path);
    }));
    this.addRibbonIcon("link", "Copy web-proxy link of current note", async () => {
      const f = this.app.workspace.getActiveFile();
      if (!f) return new import_obsidian2.Notice("No active note");
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
        if (!checking) this.insertLinkInEditor(f, editor);
        return true;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof import_obsidian2.TFile) {
        menu.addItem(
          (item) => item.setTitle("Copy web-proxy link").setIcon("link").onClick(() => this.copyForFile(file, false))
        );
      }
    }));
    this.addSettingTab(new ProxyLinkerSettingTab(this.app, this));
    if (this.settings.useIntegratedServer) this.startServer();
  }
  onunload() {
    this.stopServer();
  }
  startServer() {
    if (this.server) return;
    this.server = new IntegratedServer(this);
    this.server.start();
    if (!this.settings.useIntegratedServer) return;
    new import_obsidian2.Notice(`Web Proxy Linker: server ${this.settings.listenHost}:${this.settings.serverPort}`);
  }
  stopServer() {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
  getHeadingFromEditorIfAny(forFile) {
    var _a;
    if (!this.settings.addHeadingAnchor) return void 0;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    if (!view) return void 0;
    if (((_a = view.file) == null ? void 0 : _a.path) !== forFile.path) return void 0;
    const editor = view.editor;
    const cur = editor.getCursor().line;
    for (let i = cur; i >= 0; i--) {
      const line = editor.getLine(i);
      const m = /^\s*#+\s+(.+)$/.exec(line);
      if (m) return m[1].trim();
    }
    return void 0;
  }
  async copyForFile(file, useHeadingFromEditor) {
    const heading = useHeadingFromEditor ? this.getHeadingFromEditorIfAny(file) : void 0;
    const url = await buildProxyUrl(this.app, this.settings, this.indexer, file, heading);
    const ok = await this.copyToClipboard(url);
    new import_obsidian2.Notice(ok ? "Link copied to clipboard" : url);
  }
  async insertLinkInEditor(file, editor) {
    const heading = this.getHeadingFromEditorIfAny(file);
    const url = await buildProxyUrl(this.app, this.settings, this.indexer, file, heading);
    const title = file.basename + (heading ? ` \u2014 ${heading}` : "");
    const md = `[${title}](${url})`;
    editor.replaceSelection(md);
    new import_obsidian2.Notice("Link inserted");
  }
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch (e2) {
        return false;
      }
    }
  }
  async loadSettings() {
    const raw = await this.loadData();
    if (!raw) {
      this.settings = { ...DEFAULT_SETTINGS };
      this.registry = {};
      return;
    }
    if (raw && raw.routeStyle) {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
      this.registry = {};
    } else {
      const d = raw;
      this.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
      this.registry = d.registry || {};
    }
  }
  async saveSettings() {
    const data = { settings: this.settings, registry: this.registry };
    await this.saveData(data);
    if (this.settings.useIntegratedServer) {
      this.stopServer();
      this.startServer();
    } else {
      this.stopServer();
    }
  }
};
//# sourceMappingURL=main.js.map
