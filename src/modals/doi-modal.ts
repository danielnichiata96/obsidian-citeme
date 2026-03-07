import { App, Modal, Notice, Setting } from "obsidian";
import { CitationResult, CiteMeApiError, searchCitations } from "../api";
import { CiteMeSettings } from "../settings";
import { canUseStyle, type QuotaInfo } from "../utils/access";

export class CiteMeDoiModal extends Modal {
	private settings: CiteMeSettings;
	private onResult: (result: CitationResult) => void;
	private onQuotaUpdate: (quota: QuotaInfo) => void;
	private onApiError: (error: unknown) => void;
	private inputValue = "";
	private accessTier: string | null;

	constructor(
		app: App,
		settings: CiteMeSettings,
		onResult: (result: CitationResult) => void,
		onQuotaUpdate: (quota: QuotaInfo) => void,
		onApiError: (error: unknown) => void,
		accessTier?: string | null
	) {
		super(app);
		this.settings = settings;
		this.onResult = onResult;
		this.onQuotaUpdate = onQuotaUpdate;
		this.onApiError = onApiError;
		this.accessTier = accessTier || null;
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
					this.submitDoi();
				}
			});
			setTimeout(() => text.inputEl.focus(), 50);
		});

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Search")
				.setCta()
				.onClick(() => this.submitDoi());
		});
	}

	private async submitDoi(): Promise<void> {
		const doi = this.inputValue.trim();
		if (!doi) {
			new Notice("Please enter a DOI");
			return;
		}

		if (!canUseStyle(this.settings.defaultStyle, this.accessTier)) {
			this.onApiError(
				new CiteMeApiError(
					"style_requires_pro",
					"This citation style requires CiteMe Pro.",
					403,
					null,
					this.settings.defaultStyle
				)
			);
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

			if (response.data.citations.length === 0) {
				new Notice("No results found for this DOI");
				return;
			}

			this.close();
			this.onResult(response.data.citations[0]);
		} catch (error) {
			this.onApiError(error);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
