import { App, Modal, Notice, Setting } from "obsidian";
import { CitationResult, searchCitations } from "../api";
import { CiteMeSettings } from "../settings";

export class CiteMeDoiModal extends Modal {
	private settings: CiteMeSettings;
	private onResult: (result: CitationResult) => void;
	private inputValue = "";

	constructor(
		app: App,
		settings: CiteMeSettings,
		onResult: (result: CitationResult) => void
	) {
		super(app);
		this.settings = settings;
		this.onResult = onResult;
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
			// Focus the input
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

			if (response.data.citations.length === 0) {
				new Notice("No results found for this DOI");
				return;
			}

			this.close();
			this.onResult(response.data.citations[0]);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Unknown error";
			new Notice(`CiteMe: Search failed - ${message}`);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
