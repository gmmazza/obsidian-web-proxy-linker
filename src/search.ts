import type { App } from "obsidian";

export function openSearchWithQuery(app: App, q: string) {
  const leaves = app.workspace.getLeavesOfType('search');
  const leaf = leaves[0] || app.workspace.getRightLeaf(false);
  leaf.setViewState({ type: 'search', state: { query: q } as any });
  app.workspace.revealLeaf(leaf);
}
