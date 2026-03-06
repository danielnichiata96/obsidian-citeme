import { App, Notice, SuggestModal } from "obsidian";
import { CitationResult, searchCitations } from "../api";
import { CiteMeSettings } from "../settings";
import { InsertFormat } from "../utils/formatter";

export class CiteMeSearchModal extends SuggestModal<CitationResult> {
	private settings: CiteMeSettings;
	private onChoose: (result: CitationResult) => void;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private lastResults: CitationResult[] = [];
	private initialQuery: string;
	private formatOverride: InsertFormat | null;
	private currentRequestId = 0;

	constructor(
		app: App,
		settings: CiteMeSettings,
		onChoose: (result: CitationResult) => void,
		initialQuery?: string,
		formatOverride?: InsertFormat
	) {
		super(app);
		this.settings = settings;
		this.onChoose = onChoose;
		this.initialQuery = initialQuery || "";
		this.formatOverride = formatOverride || null;

		this.setPlaceholder("Search academic citations...");
		this.setInstructions([
			{ command: "Type", purpose: "to search papers" },
			{ command: "Enter", purpose: "to insert citation" },
			{ command: "Esc", purpose: "to dismiss" },
		]);
	}

	onOpen(): void {
		super.onOpen();
		if (this.initialQuery) {
			const inputEl = this.inputEl;
			inputEl.value = this.initialQuery;
			inputEl.dispatchEvent(new Event("input"));
		}
	}

	getSuggestions(
		query: string
	): CitationResult[] | Promise<CitationResult[]> {
		if (!query || query.length < 3) {
			this.lastResults = [];
			return [];
		}

		return new Promise((resolve) => {
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
			}

			this.debounceTimer = setTimeout(async () => {
				// Tag this request so we can discard stale responses
				const requestId = ++this.currentRequestId;

				try {
					const response = await searchCitations(
						{
							query,
							style: this.settings.defaultStyle,
							limit: this.settings.defaultLimit,
							sortBy: this.settings.sortBy,
						},
						this.settings.apiBaseUrl
					);

					// Discard if a newer request was fired while this one was in flight
					if (requestId !== this.currentRequestId) {
						return;
					}

					this.lastResults = response.data.citations;
					resolve(this.lastResults);
				} catch (err) {
					// Discard errors from stale requests
					if (requestId !== this.currentRequestId) {
						return;
					}

					const message =
						err instanceof Error ? err.message : "Unknown error";
					new Notice(`CiteMe: Search failed - ${message}`);
					resolve([]);
				}
			}, 300);
		});
	}

	renderSuggestion(result: CitationResult, el: HTMLElement): void {
		const container = el.createDiv({ cls: "citeme-result" });

		const titleEl = container.createDiv({ cls: "citeme-result-title" });
		titleEl.setText(result.paper.title);

		const metaEl = container.createDiv({ cls: "citeme-result-meta" });

		const parts: string[] = [];
		if (result.paper.authors.length > 0) {
			const authors =
				result.paper.authors.length > 3
					? `${result.paper.authors[0]} et al.`
					: result.paper.authors.join(", ");
			parts.push(authors);
		}
		if (result.paper.year) {
			parts.push(String(result.paper.year));
		}
		if (result.paper.venue) {
			parts.push(result.paper.venue);
		}

		let metaText = parts.join(" · ");

		if (result.paper.doi) {
			metaText += " · DOI";
		}
		if (result.paper.citationCount > 0) {
			metaText += ` · ${formatCitationCount(result.paper.citationCount)} citations`;
		}

		metaEl.setText(metaText);

		if (result.paper.abstract) {
			const abstractEl = container.createDiv({
				cls: "citeme-result-abstract",
			});
			const abstractText =
				result.paper.abstract.length > 150
					? result.paper.abstract.substring(0, 150) + "..."
					: result.paper.abstract;
			abstractEl.setText(abstractText);
		}
	}

	onChooseSuggestion(result: CitationResult): void {
		this.onChoose(result);
	}

	getFormatOverride(): InsertFormat | null {
		return this.formatOverride;
	}
}

function formatCitationCount(count: number): string {
	if (count >= 1000) {
		return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
	}
	return String(count);
}
