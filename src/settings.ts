import { App, PluginSettingTab, Setting } from "obsidian";
import type CiteMePlugin from "../main";
import {
	SORT_OPTIONS,
	INSERT_FORMATS,
	DEFAULT_SETTINGS,
	CITEME_APP_URL,
} from "./utils/constants";
import { canUseStyle, getCitationStyleOptions } from "./utils/access";

export interface CiteMeSettings {
	defaultStyle: string;
	defaultLimit: number;
	insertFormat: "bibliography" | "inText" | "inTextNarrative" | "both";
	addToReferencesSection: boolean;
	referencesHeading: string;
	sortBy: "relevance" | "year" | "citations";
	apiBaseUrl: string;
}

export function getDefaultSettings(): CiteMeSettings {
	return { ...DEFAULT_SETTINGS };
}

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
			.setName("CiteMe account")
			.setDesc(
				"Sign in at citeme.app to unlock more citations and Pro styles."
			)
			.addButton((btn) => {
				btn.setButtonText("Open citeme.app").onClick(() => {
					window.open(CITEME_APP_URL, "_blank");
				});
			});

		new Setting(containerEl)
			.setName("Citation style")
			.setDesc(
				"Default citation format style. Anonymous mode supports 10 styles; Pro styles are marked."
			)
			.addDropdown((dropdown) => {
				for (const [value, label] of getCitationStyleOptions(
					this.plugin.getAccessTier()
				)) {
					dropdown.addOption(value, label);
				}
				dropdown.setValue(this.plugin.settings.defaultStyle);
				let previousValue = this.plugin.settings.defaultStyle;
				dropdown.onChange(async (value) => {
					if (!canUseStyle(value, this.plugin.getAccessTier())) {
						dropdown.setValue(previousValue);
						this.plugin.showStyleUpgradeNotice(value);
						return;
					}
					this.plugin.settings.defaultStyle = value;
					previousValue = value;
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
			.setName("Add to References section")
			.setDesc(
				"Automatically append full citation to a References section"
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
			.setName("References heading")
			.setDesc(
				"Markdown heading for the references section (e.g. ## References)"
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
