import { App, Modal } from "obsidian";
import { CitationResult } from "../api";
import { formatAuthorList } from "../utils/citation-result";

export class CiteMeResultModal extends Modal {
	private result: CitationResult;
	private onInsert: (result: CitationResult) => void;

	constructor(
		app: App,
		result: CitationResult,
		onInsert: (result: CitationResult) => void
	) {
		super(app);
		this.result = result;
		this.onInsert = onInsert;
	}

	onOpen(): void {
		const { contentEl } = this;
		const paper = this.result.paper;
		const formatted = this.result.formatted;

		contentEl.addClass("citeme-detail-modal");

		contentEl.createEl("h2", { text: paper.title });

		const metaEl = contentEl.createDiv({ cls: "citeme-detail-meta" });

		if (paper.authors.length > 0) {
			metaEl.createEl("p", {
				text: `Authors: ${formatAuthorList(paper.authors)}`,
			});
		}
		if (paper.year) {
			metaEl.createEl("p", { text: `Year: ${paper.year}` });
		}
		if (paper.venue) {
			metaEl.createEl("p", { text: `Venue: ${paper.venue}` });
		}
		if (paper.doi) {
			const doiEl = metaEl.createEl("p");
			doiEl.appendText("DOI: ");
			doiEl.createEl("a", {
				text: paper.doi,
				href: `https://doi.org/${paper.doi}`,
			});
		}
		if (paper.citationCount > 0) {
			metaEl.createEl("p", {
				text: `Citations: ${paper.citationCount.toLocaleString()}`,
			});
		}

		if (paper.abstract) {
			contentEl.createEl("h3", { text: "Abstract" });
			contentEl.createEl("p", {
				text: paper.abstract,
				cls: "citeme-detail-abstract",
			});
		}

		contentEl.createEl("h3", { text: "Formatted citations" });

		const citationsEl = contentEl.createDiv({
			cls: "citeme-detail-citations",
		});

		createCitationBlock(citationsEl, "Bibliography", formatted.reference);
		createCitationBlock(citationsEl, "In-text", formatted.inText);

		const btnContainer = contentEl.createDiv({
			cls: "citeme-detail-buttons",
		});
		const insertBtn = btnContainer.createEl("button", {
			text: "Insert citation",
			cls: "mod-cta",
		});
		insertBtn.addEventListener("click", () => {
			this.onInsert(this.result);
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function createCitationBlock(
	parent: HTMLElement,
	label: string,
	text: string
): void {
	const block = parent.createDiv({ cls: "citeme-citation-block" });
	block.createEl("strong", { text: `${label}: ` });
	block.createEl("code", { text });
}
