Obsidian Web Proxy Linker

Overview
- Generates links that open your notes in Obsidian Desktop.
- Robust to file moves and renames with “Smart Path” fallback.
- Optional advanced stability via Frontmatter UID or Local Registry.
- Includes a small local HTTP server (Desktop only) or works with an external proxy URL.

Key Features
- Smart Path (default):
  - Creates links that include the file path.
  - If you move/rename a note, the plugin derives the filename and, when duplicates exist, opens Obsidian Search filtered to filenames only (file:"<name>").
  - If there is exactly one match, it opens that note directly.
- Frontmatter UID: Reads/writes a unique ID in the note’s YAML frontmatter to create stable links across devices.
- Local Registry: Stores stable IDs in plugin data (per device, no note changes).
- Add current heading if available: If your cursor is on a section, links open at that heading.

Compatibility
- Obsidian Desktop 1.5.0 or newer.
- Windows, macOS, Linux (Desktop). The integrated server requires Desktop (Electron);
  mobile is unsupported for the local server.

Install via BRAT (Recommended for testing)
1) In Obsidian, install and enable “BRAT – Beta Reviewers Auto-update Tester”.
2) In BRAT, add a beta plugin using this repository URL:
   - Repository: <your-github-user>/obsidian-web-proxy-linker
   - Branch: feature/remove-basename-strategy (or main, once merged)
3) BRAT will install the plugin into your vault.
4) Enable “Web Proxy Linker” in Settings → Community plugins → Installed plugins.

Manual Install (from source)
1) Clone this repo or place it in your vault under `.obsidian/plugins/obsidian-web-proxy-linker`.
2) From the plugin folder, run:
   - npm ci
   - npm run build
3) Reload Obsidian (Ctrl/Cmd+R) and enable the plugin.

Quick Start
- Ribbon button “link”: copies a web‑proxy link for the current note.
- Command palette:
  - “Copy web‑proxy link of current note”
  - “Insert web‑proxy link into editor”

Settings
Server Configuration
- Use integrated server: Starts a small local HTTP server (default 127.0.0.1:27124).
  - If ON: configure Server port and Listen host (127.0.0.1 recommended).
  - If OFF: set External proxy Base URL (e.g., http://127.0.0.1:27124 for an external proxy).

Link Generation
- Route style:
  - query: /open?u=obsidian://...
  - pretty: /v/<Vault>/<path>?h=Heading
- Add current heading if available: uses your cursor’s nearest heading.
- Vault name override: leave empty to use the real vault name.

Linking Strategy
- Path (smart fallback) [Default]: simple links that recover from moves via filename matching.
- Frontmatter UID: stores a stable ID in note YAML; best for multi-device setups.
- Local registry: stores a stable ID locally (no file changes). Export/import if needed across devices.

How Links Open
- The integrated server receives your link and decides how to open:
  1) If a Frontmatter UID or Local Registry ID is present, it resolves to the current path and opens it.
  2) Otherwise, Smart Path derives the filename and:
     - If multiple matches: opens the Search view with file:"<name>".
     - If one match: opens that note directly.
  3) If the explicit path exists, it opens that path.

Troubleshooting
- Plugin not visible: folder must be named `obsidian-web-proxy-linker` and contain `manifest.json` and `main.js`.
- Port in use: change Server port in the settings.
- No Search on duplicates: ensure you’re on the latest version and reload (Ctrl/Cmd+R).
- Mobile: the integrated server requires Desktop (Electron). Use an external proxy if needed.

Privacy & Security
- The integrated server listens by default on 127.0.0.1 only.
- No analytics, no remote calls.

Changelog
- 1.3.0
  - Smart Path default; duplicates open Search with file:"<name>".
  - Removed Basename strategy and QuickSwitcher++ integration.
  - Conditional settings UI sections.

License
- MIT

