# 🎯 Obsidian Web Proxy Linker

##  Overview
- 🔗 Generates links compatible for webrowsers that open your notes in Obsidian Desktop.
- 🛠  Robust to file moves and renames and duplicates with “Smart Path” fallback.
- 🆔 Optional advanced stability via Frontmatter UniqueID or Local Registry.
- 🌐 Includes a small local HTTP server (Desktop only) or works with an external proxy URL.

---

##  Key Features

###  Smart Path (default)
- Includes the file path in generated links.
- If a note is moved, renamed, or duplicated, the plugin finds it by filename:
  - Multiple matches → opens Obsidian search (`file:"<name>"`).
  - Single match → opens that note directly.

###  Frontmatter UID
- Adds a unique ID inside the note’s YAML frontmatter to maintain stable links across devices.

###  Local Registry
- Stores stable IDs in plugin data (device-local, no changes to notes needed).

###  Heading Targeting
- If your cursor is on a section heading, links will open at that specific heading.

---

##  Compatibility
- **Obsidian Desktop 1.5.0** or newer.
- Platforms supported: Windows, macOS, Linux (Desktop only—local server requires Electron; mobile unsupported for local server).

---

##  Installation

### Via BRAT (Recommended for testing)
1. In Obsidian, install and enable **BRAT – Beta Reviewers Auto-update Tester**.
2. Add a beta plugin using this repo:
   - **Repository:** `gmmazza/obsidian-web-proxy-linker`
3. BRAT installs the plugin into your vault.
4. Enable **Web Proxy Linker** via `Settings → Community plugins → Installed plugins`.

### Manual Install (from source)
1. Clone or place the plugin in `.obsidian/plugins/obsidian-web-proxy-linker`.
2. In that folder, run:
   ```bash
   npm ci
   npm run build
3. Reload Obsidian (`Ctrl/Cmd+R`) and enable the plugin.

---

## Quick Start

* **Ribbon Button (“link”)**: Copies a web-proxy link for the current note.
* **Command Palette**: `Copy web-proxy link of current note`
* **Note - More options**: `Copy web-proxy link`

---

## Settings

### Server Configuration

* **Integrated server (default)**:

  * Runs local HTTP server (`127.0.0.1:27124`).
  * Configurable: server port and host (127.0.0.1 recommended).
* **External proxy**:

  * Turn off the integrated server and set an external proxy base URL (e.g. `http://127.0.0.1:27124`).

### Link Generation

* **Route style**:

  * `query`: `/open?u=obsidian://...` - This format keeps the Obsidian URI for backwards compatibity
  * `pretty`: `/v/<Vault>/<path>?h=Heading` - This format make the URI more easily readable
* Option to include the current heading (cursor-relevant).
* Vault name override (leave blank to use default).

### Linking Strategy

* **Path (Smart fallback)** — default. - For the most common cases; No edit of the note, and low manteinance and aceptable file management. 
* **Frontmatter UID** — best for multi-device setups and robust note identification.
* **Local Registry** — Robust note identification with no file edits; export/import if needed across devices. Depends on aditional local files as a database.

---

## How Links Open

1. Checks for Frontmatter UID or Local Registry ID → resolves and opens the current path.
2. Else, uses Smart Path:

   * Multiple matches → opens Search (`file:"<name>"`).
   * Single match → opens the note directly.
3. If explicit path exists, opens that directly.

---

## Troubleshooting

* **Port in use**: Change the server port in settings.
* **Mobile unsupported**: For local server, use an external proxy.

---

## Privacy & Security

* Server listens only on `127.0.0.1` by default.
* No analytics, no remote calls—100% local.

---

## License

* **MIT License**

---

✨ Thank you for checking out **Obsidian Web Proxy Linker**! Please open issues or feature requests on GitHub—I’d love your feedback!

