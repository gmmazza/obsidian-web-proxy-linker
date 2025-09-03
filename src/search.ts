import type { App } from "obsidian";

export function openSearchWithQuery(app: App, q: string) {
  const leaves = app.workspace.getLeavesOfType('search');
  const leaf = leaves[0] || app.workspace.getRightLeaf(false);
  leaf.setViewState({ type: 'search', state: { query: q } as any });
  app.workspace.revealLeaf(leaf);
}

export function tryOpenQuickSwitcher(app: App): boolean {
  const cmds = (app as any).commands?.commands as Record<string, any> | undefined;
  if (!cmds) return false;
  const candidates = [
    // Your QuickSwitcher++ (Darlal) specific ids
    'darlal-switcher-plus:switcher-plus:open',
    'darlal-switcher-plus:switcher-plus:open-editors',
    // Quick Switcher++ (unknown exact id; try common patterns)
    'quick-switcher-plus:open',
    'switcher-plus:open',
    'obsidian-quick-switcher-plus:open',
    // Fallback to Obsidian built-in switcher
    'switcher:open',
  ];
  for (const id of candidates) {
    if (cmds[id]) {
      (app as any).commands.executeCommandById(id);
      return true;
    }
  }
  // Last attempt: built-in
  if (cmds['switcher:open']) {
    (app as any).commands.executeCommandById('switcher:open');
    return true;
  }
  return false;
}
