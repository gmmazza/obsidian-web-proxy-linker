import type { App, TFile } from "obsidian";
import { getBaseUrl, getVaultName, type ProxyLinkerSettings } from "./settings";
import { ensureUidForFile } from "./uid";
import { IndexManager } from "./indexer";

export function buildObsidianUrl(app: App, settings: ProxyLinkerSettings, file: TFile, heading?: string): string {
  const vault = encodeURIComponent(getVaultName(app, settings));
  const encodedPath = encodeURIComponent(file.path);
  let url = `obsidian://open?vault=${vault}&file=${encodedPath}`;
  if (heading) url += `#${encodeURIComponent(heading)}`;
  return url;
}

export async function buildProxyUrl(app: App, settings: ProxyLinkerSettings, indexer: IndexManager, file: TFile, heading?: string): Promise<string> {
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

