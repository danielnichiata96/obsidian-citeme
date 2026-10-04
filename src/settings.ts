import { App, PluginSettingTab, Setting } from "obsidian";
import type CiteMePlugin from "../main";
import {
	SORT_OPTIONS,
	INSERT_FORMATS,
	CITEME_SETTINGS_LINK,
	CITEME_TOKEN_LINK,
} from "./utils/constants";
import {
	ANONYMOUS_CHECKS_PER_MONTH,
	ANONYMOUS_REFERENCES_PER_CHECK,
} from "./utils/reference-check";
import { getCitationStyleOptions } from "./utils/access";
import type { CiteMeSettings } from "./utils/settings-migration";

export type { CiteMeSettings } from "./utils/settings-migration";

export class CiteMeSettingTab extends PluginSettingTab {
	plugin: CiteMePlugin;

	constructor(app: App, plugin: CiteMePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Access")
			.setDesc(this.plugin.getAccessSummary());

		new Setting(containerEl)
			.setName("CiteMe on the web")
			.setDesc(
				"The plugin works without an account. Your library, reference checking, and exports live on citeme.app."
			)
			.addButton((btn) => {
				btn.setButtonText("Open citeme.app").onClick(() => {
					window.open(CITEME_SETTINGS_LINK, "_blank");
				});
			});

		new Setting(containerEl)
			.setName("Citation style")
			.setDesc("Default citation style")
			.addDropdown((dropdown) => {
				for (const [value, label] of getCitationStyleOptions()) {
					dropdown.addOption(value, label);
				}
				dropdown.setValue(this.plugin.settings.defaultStyle);
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultStyle = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Results limit")
			.setDesc("Number of results to fetch (1-20)")
			.addSlider((slider) => {
				slider
					.setLimits(1, 20, 1)
					.setValue(this.plugin.settings.defaultLimit)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.defaultLimit = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Insert format")
			.setDesc("How citations are inserted into notes")
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(INSERT_FORMATS)) {
					dropdown.addOption(value, label);
				}
				dropdown.setValue(this.plugin.settings.insertFormat);
				dropdown.onChange(async (value) => {
					this.plugin.settings.insertFormat =
						value as CiteMeSettings["insertFormat"];
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Sort by")
			.setDesc("Default sort order for search results")
			.addDropdown((dropdown) => {
				for (const [value, label] of Object.entries(SORT_OPTIONS)) {
					dropdown.addOption(value, label);
				}
				dropdown.setValue(this.plugin.settings.sortBy);
				dropdown.onChange(async (value) => {
					this.plugin.settings.sortBy =
						value as CiteMeSettings["sortBy"];
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Add to references section")
			.setDesc(
				"Automatically append full citation to a references section"
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addToReferencesSection)
					.onChange(async (value) => {
						this.plugin.settings.addToReferencesSection = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("CiteMe token")
			.setDesc(
				`Optional, for "Check references in this note". With a token, checks use your CiteMe plan; Pro has no monthly limit. Without one, a check covers up to ${ANONYMOUS_REFERENCES_PER_CHECK} references and each network gets ${ANONYMOUS_CHECKS_PER_MONTH} checks a month. The token is saved in this vault's plugin data, so leave it out of vaults you share.`
			)
			.addText((text) => {
				text.inputEl.type = "password";
				text.setPlaceholder("cme_...")
					.setValue(this.plugin.settings.apiToken)
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value.trim();
						await this.plugin.saveSettings();
					});
			})
			.addButton((btn) => {
				btn.setButtonText("Create a token").onClick(() => {
					window.open(CITEME_TOKEN_LINK, "_blank");
				});
			});

		new Setting(containerEl)
			.setName("References heading")
			.setDesc(
				"Heading used for the references section (e.g. ## References)"
			)
			.addText((text) => {
				text.setPlaceholder("## References")
					.setValue(this.plugin.settings.referencesHeading)
					.onChange(async (value) => {
						this.plugin.settings.referencesHeading = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
