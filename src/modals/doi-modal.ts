import { App, Modal, Notice, Setting } from "obsidian";
import { CitationResult, searchCitations } from "../api";
import type { QuotaInfo } from "../utils/access";
import type { CiteMeSettings } from "../utils/settings-migration";

export class CiteMeDoiModal extends Modal {
	private settings: CiteMeSettings;
	private onResult: (result: CitationResult) => void;
	private onQuotaUpdate: (quota: QuotaInfo) => void;
	private onApiError: (error: unknown) => void;
	private inputValue = "";

	constructor(
		app: App,
		settings: CiteMeSettings,
		onResult: (result: CitationResult) => void,
		onQuotaUpdate: (quota: QuotaInfo) => void,
		onApiError: (error: unknown) => void
	) {
		super(app);
		this.settings = settings;
		this.onResult = onResult;
		this.onQuotaUpdate = onQuotaUpdate;
		this.onApiError = onApiError;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Search by DOI" });

		new Setting(contentEl).setName("DOI").addText((text) => {
			text.setPlaceholder("10.1234/example.doi");
			text.onChange((value) => {
				this.inputValue = value;
			});
			text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
				if (e.key === "Enter") {
					e.preventDefault();
					void this.submitDoi();
				}
			});
			setTimeout(() => text.inputEl.focus(), 50);
		});

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Search")
				.setCta()
				.onClick(() => {
					void this.submitDoi();
				});
		});
	}

	private async submitDoi(): Promise<void> {
		const doi = this.inputValue.trim();
		if (!doi) {
			new Notice("Please enter a DOI");
			return;
		}

		try {
			new Notice("Searching...");
			const response = await searchCitations(
				{
					query: doi,
					style: this.settings.defaultStyle,
					limit: 1,
				},
				this.settings.apiBaseUrl
			);
			this.onQuotaUpdate(response.quota);

			if (response.citations.length === 0) {
				new Notice("No results found for this DOI");
				return;
			}

			this.close();
			this.onResult(response.citations[0]);
		} catch (error) {
			this.onApiError(error);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
