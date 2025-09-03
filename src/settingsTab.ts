import { App, PluginSettingTab, Setting } from "obsidian";
import type WebProxyLinkerPlugin from "./main";
import type { LinkStrategy, ProxyLinkerSettings, UidFormat } from "./settings";

export class ProxyLinkerSettingTab extends PluginSettingTab {
  plugin: WebProxyLinkerPlugin;
  constructor(app: App, plugin: WebProxyLinkerPlugin) { super(app, plugin); this.plugin = plugin; }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    containerEl.createEl("h2", { text: "Web Proxy Linker" });

    // Server
    new Setting(containerEl)
      .setName("Use integrated server")
      .setDesc("Starts http://127.0.0.1:<port>. If sandboxed, it will auto-disable.")
      .addToggle((t) => t
        .setValue(this.plugin.settings.useIntegratedServer)
        .onChange(async (v) => { this.plugin.settings.useIntegratedServer = v; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Server port")
      .setDesc("Default 27124")
      .addText((t) => t
        .setPlaceholder("27124")
        .setValue(String(this.plugin.settings.serverPort))
        .onChange(async (v) => { const n = parseInt(v, 10); if (!isNaN(n) && n > 0 && n < 65536) this.plugin.settings.serverPort = n; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Listen host")
      .setDesc("Use 127.0.0.1 to keep it local only")
      .addText((t) => t
        .setPlaceholder("127.0.0.1")
        .setValue(this.plugin.settings.listenHost)
        .onChange(async (v) => { this.plugin.settings.listenHost = (v || "127.0.0.1").trim(); await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("External proxy Base URL")
      .setDesc("Only used if integrated server is OFF")
      .addText((t) => t
        .setPlaceholder("http://localhost:27124")
        .setValue(this.plugin.settings.baseUrl)
        .onChange(async (v) => { this.plugin.settings.baseUrl = v.trim(); await this.plugin.saveSettings(); })
      );

    // Link style
    new Setting(containerEl)
      .setName("Route style")
      .setDesc("'query' uses /open?u=..., 'pretty' uses /v/<Vault>/<path>?h=Heading")
      .addDropdown((d) => d
        .addOptions({ query: "query", pretty: "pretty" })
        .setValue(this.plugin.settings.routeStyle)
        .onChange(async (v: any) => { this.plugin.settings.routeStyle = v; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Add current heading if available")
      .setDesc("Automatically add heading anchor based on the cursor position")
      .addToggle((t) => t
        .setValue(this.plugin.settings.addHeadingAnchor)
        .onChange(async (v) => { this.plugin.settings.addHeadingAnchor = v; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Vault name override (optional)")
      .setDesc("Leave empty to use the vault's real name")
      .addText((t) => t
        .setPlaceholder("MyVault")
        .setValue(this.plugin.settings.vaultNameOverride)
        .onChange(async (v) => { this.plugin.settings.vaultNameOverride = v.trim(); await this.plugin.saveSettings(); })
      );

    // Strategy
    containerEl.createEl("h3", { text: "Linking strategy" });
    new Setting(containerEl)
      .setName("Strategy")
      .setDesc("Choose how links stay stable when files move")
      .addDropdown((d) => d
        .addOptions({
          "path": "Path (smart fallback)",
          "frontmatter-uid": "Frontmatter UID",
          "local-registry": "Local registry (no file changes)",
          "basename": "Basename (search on duplicates)",
        })
        .setValue(this.plugin.settings.linkStrategy)
        .onChange(async (v: any) => { this.plugin.settings.linkStrategy = v as LinkStrategy; await this.plugin.saveSettings(); })
      );

    // Basename: duplicates always open Search (no extra options)

    // Frontmatter UID options
    containerEl.createEl("h3", { text: "Frontmatter UID" });
    new Setting(containerEl)
      .setName("Use Note UID Generator compatibility")
      .setDesc("Respect the same YAML key if that plugin is present")
      .addToggle((t) => t
        .setValue(this.plugin.settings.useNoteUidCompat)
        .onChange(async (v) => { this.plugin.settings.useNoteUidCompat = v; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Preferred YAML key")
      .setDesc("Key used to read/write UID in frontmatter")
      .addText((t) => t
        .setPlaceholder("uid")
        .setValue(this.plugin.settings.frontmatterUidKeyPreferred)
        .onChange(async (v) => { this.plugin.settings.frontmatterUidKeyPreferred = (v || "uid").trim(); await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Also recognize keys")
      .setDesc("Comma-separated list (e.g. uid,note_uid,noteId,id)")
      .addText((t) => t
        .setPlaceholder("uid,note_uid,noteId,id")
        .setValue(this.plugin.settings.frontmatterUidKeys.join(","))
        .onChange(async (v) => { this.plugin.settings.frontmatterUidKeys = (v || "").split(",").map(s => s.trim()).filter(Boolean); await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Auto-assign UID if missing")
      .setDesc("Assign a UID on first use if the note has none")
      .addToggle((t) => t
        .setValue(this.plugin.settings.autoAssignUid)
        .onChange(async (v) => { this.plugin.settings.autoAssignUid = v; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("UID format")
      .setDesc("Default uuid-v4; nanoid-21 is compact; timestamp-rand is sortable")
      .addDropdown((d) => d
        .addOptions({ "uuid-v4": "uuid-v4", "nanoid-21": "nanoid-21", "timestamp-rand": "timestamp-rand" })
        .setValue(this.plugin.settings.uidFormat)
        .onChange(async (v: any) => { this.plugin.settings.uidFormat = v as UidFormat; await this.plugin.saveSettings(); })
      );
  }
}
