import type { App, TFile } from "obsidian";
import { getUidFromFrontmatter } from "./uid";
import type WebProxyLinkerPlugin from "./main";
import type { ProxyLinkerSettings } from "./settings";

export class IndexManager {
  private app: App;
  private settings: ProxyLinkerSettings;
  // uid (frontmatter) -> path
  private uidIndex: Map<string, string> = new Map();
  // local registry id -> path (stored in plugin data registry)
  private plugin: WebProxyLinkerPlugin;

  constructor(app: App, settings: ProxyLinkerSettings, plugin: WebProxyLinkerPlugin) {
    this.app = app; this.settings = settings; this.plugin = plugin;
  }

  rebuildAll(): void {
    this.uidIndex.clear();
    const files = this.app.vault.getFiles();
    for (const f of files) {
      const uid = getUidFromFrontmatter(this.app, f, [this.settings.frontmatterUidKeyPreferred, ...this.settings.frontmatterUidKeys]);
      if (uid) this.uidIndex.set(uid, f.path);
    }
  }

  // Frontmatter UID
  getPathByUid(uid: string | null | undefined): string | undefined {
    if (!uid) return undefined;
    return this.uidIndex.get(uid);
  }

  onFrontmatterChanged(file: TFile): void {
    const uid = getUidFromFrontmatter(this.app, file, [this.settings.frontmatterUidKeyPreferred, ...this.settings.frontmatterUidKeys]);
    // remove any entries pointing to this path
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === file.path) this.uidIndex.delete(k);
    }
    if (uid) this.uidIndex.set(uid, file.path);
  }

  onFileRenamed(oldPath: string, file: TFile): void {
    // Update uid index
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === oldPath) this.uidIndex.set(k, file.path);
    }
    // Update local registry values
    for (const [id, p] of Object.entries(this.plugin.registry)) {
      if (p === oldPath) this.plugin.registry[id] = file.path;
    }
  }

  onFileDeleted(path: string): void {
    for (const [k, p] of Array.from(this.uidIndex.entries())) {
      if (p === path) this.uidIndex.delete(k);
    }
    for (const [id, p] of Object.entries(this.plugin.registry)) {
      if (p === path) delete this.plugin.registry[id];
    }
  }

  // Local registry
  getPathByLocalId(id: string | null | undefined): string | undefined {
    if (!id) return undefined;
    return this.plugin.registry[id];
  }

  ensureLocalIdForPath(path: string): string {
    for (const [id, p] of Object.entries(this.plugin.registry)) {
      if (p === path) return id;
    }
    const id = this.makeLocalId();
    this.plugin.registry[id] = path;
    return id;
  }

  private makeLocalId(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const t = Date.now().toString(36);
    return `${t}-${rand}`;
  }
}

