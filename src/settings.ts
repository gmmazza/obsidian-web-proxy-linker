import type { App } from "obsidian";

export type RouteStyle = "query" | "pretty";
export type LinkStrategy = "path" | "frontmatter-uid" | "local-registry" | "basename";
export type UidFormat = "uuid-v4" | "nanoid-21" | "timestamp-rand";

export interface ProxyLinkerSettings {
  // Link generation
  routeStyle: RouteStyle;
  addHeadingAnchor: boolean;
  vaultNameOverride: string;
  baseUrl: string; // used when not using integrated server

  // Integrated server
  useIntegratedServer: boolean;
  serverPort: number;
  listenHost: string;

  // Linking strategy
  linkStrategy: LinkStrategy;

  // Frontmatter UID strategy
  useNoteUidCompat: boolean;
  noteUidPluginId: string | null;
  frontmatterUidKeys: string[]; // keys to look for
  frontmatterUidKeyPreferred: string; // key to write
  autoAssignUid: boolean;
  uidFormat: UidFormat;

  // Local registry strategy (ids stored locally in plugin data)
  // no extra settings needed for now; export/import will be provided via commands later

  // Basename strategy
  basenameOpenSearchOnDuplicates: boolean;
  basenamePreferQuickSwitcherPlus: boolean;
}

export interface PluginDataShapeV2 {
  settings: ProxyLinkerSettings;
  registry?: Record<string, string>; // local-registry id -> path
}

export const DEFAULT_SETTINGS: ProxyLinkerSettings = {
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
  basenamePreferQuickSwitcherPlus: false,
};

export function sanitizeBase(base: string): string { return base.replace(/\/+$/, ""); }

export function getVaultName(app: App, settings: ProxyLinkerSettings): string {
  return (settings.vaultNameOverride?.trim() || app.vault.getName());
}

export function getBaseUrl(settings: ProxyLinkerSettings): string {
  if (settings.useIntegratedServer) {
    const host = settings.listenHost || "127.0.0.1";
    return `http://${host}:${settings.serverPort}`;
  } else {
    return sanitizeBase(settings.baseUrl || "http://127.0.0.1:27124");
  }
}

