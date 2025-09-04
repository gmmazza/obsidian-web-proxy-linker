import type { App, TFile } from "obsidian";
import { type ProxyLinkerSettings, type UidFormat } from "./settings";

export function getUidFromFrontmatter(app: App, file: TFile, keys: string[]): string | undefined {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter as Record<string, any> | undefined;
  if (!fm) return undefined;
  for (const k of keys) {
    const v = fm[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export async function ensureUidForFile(app: App, file: TFile, settings: ProxyLinkerSettings): Promise<string | undefined> {
  let uid = getUidFromFrontmatter(app, file, [settings.frontmatterUidKeyPreferred, ...settings.frontmatterUidKeys]);
  if (uid) return uid;
  if (!settings.autoAssignUid) return undefined;

  uid = generateUid(settings.uidFormat);
  try {
    await app.fileManager.processFrontMatter(file, (fm) => {
      (fm as any)[settings.frontmatterUidKeyPreferred] = uid!;
    });
    return uid;
  } catch {
    return undefined;
  }
}

export function generateUid(fmt: UidFormat): string {
  if (fmt === "uuid-v4") return uuidv4();
  if (fmt === "nanoid-21") return nanoid21();
  // timestamp-rand
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
}

function uuidv4(): string {
  // RFC 4122 v4 using crypto if available
  const g: any = (globalThis as any);
  if (g.crypto?.getRandomValues) {
    const b = new Uint8Array(16);
    g.crypto.getRandomValues(b);
    // Per RFC
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Fallback (non‑crypto)
  let s = "";
  for (let i = 0; i < 36; i++) s += "x";
  return s.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nanoid21(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
  const g: any = (globalThis as any);
  const buf = new Uint8Array(21);
  if (g.crypto?.getRandomValues) g.crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = (Math.random() * 256) | 0;
  let id = "";
  for (let i = 0; i < buf.length; i++) id += alphabet[buf[i] & 63];
  return id;
}

export function detectNoteUidPluginIds(): string[] {
  // Best-effort known ids; can be extended
  return [
    "obsidian-note-uid-generator",
    "note-uid-generator",
    "obsidian_note_uid_generator",
  ];
}

export function isPluginInstalled(app: App, id: string): boolean {
  try {
    return !!(app as any).plugins?.plugins?.[id];
  } catch { return false; }
}

