import { App, SuggestModal } from "obsidian";
import { CitationResult, CiteMeApiError, searchCitations } from "../api";
import { CiteMeSettings } from "../settings";
import { canUseStyle, type QuotaInfo } from "../utils/access";
import { InsertFormat } from "../utils/formatter";

export class CiteMeSearchModal extends SuggestModal<CitationResult> {
	private settings: CiteMeSettings;
	private onChoose: (result: CitationResult) => void;
	private onQuotaUpdate: (quota: QuotaInfo) => void;
	private onApiError: (error: unknown) => void;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private lastResults: CitationResult[] = [];
	private pendingResolve: ((results: CitationResult[]) => void) | null = null;
	private initialQuery: string;
	private formatOverride: InsertFormat | null;
	private accessTier: string | null;
	private currentRequestId = 0;

	constructor(
		app: App,
		settings: CiteMeSettings,
		onChoose: (result: CitationResult) => void,
		onQuotaUpdate: (quota: QuotaInfo) => void,
		onApiError: (error: unknown) => void,
		initialQuery?: string,
		formatOverride?: InsertFormat,
		accessTier?: string | null
	) {
		super(app);
		this.settings = settings;
		this.onChoose = onChoose;
		this.onQuotaUpdate = onQuotaUpdate;
		this.onApiError = onApiError;
		this.initialQuery = initialQuery || "";
		this.formatOverride = formatOverride || null;
		this.accessTier = accessTier || null;

		this.setPlaceholder("Search academic citations...");
		this.setInstructions([
			{ command: "Type", purpose: "to search papers" },
			{ command: "Enter", purpose: "to insert citation" },
			{ command: "Esc", purpose: "to dismiss" },
		]);
	}

	onOpen(): void {
		void super.onOpen();
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
			this.currentRequestId++;
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
				this.debounceTimer = null;
			}
			if (this.pendingResolve) {
				this.pendingResolve([]);
				this.pendingResolve = null;
			}
			this.lastResults = [];
			return [];
		}

		const style = this.settings.defaultStyle;
		if (!canUseStyle(style, this.accessTier)) {
			this.onApiError(
				new CiteMeApiError(
					"style_requires_pro",
					"This citation style requires CiteMe Pro.",
					403,
					null,
					style
				)
			);
			this.lastResults = [];
			return [];
		}

		return new Promise((resolve) => {
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
			}
			if (this.pendingResolve) {
				this.pendingResolve([]);
				this.pendingResolve = null;
			}

			const requestId = ++this.currentRequestId;
			this.pendingResolve = resolve;

			this.debounceTimer = setTimeout(() => {
				void (async () => {
					try {
						const response = await searchCitations(
							{
								query,
								style,
								limit: this.settings.defaultLimit,
								sortBy: this.settings.sortBy,
							},
							this.settings.apiBaseUrl
						);

						if (requestId !== this.currentRequestId) {
							resolve([]);
							return;
						}

						this.onQuotaUpdate(response.quota);
						this.lastResults = response.data.citations;
						this.pendingResolve = null;
						resolve(this.lastResults);
					} catch (error) {
						if (requestId !== this.currentRequestId) {
							resolve([]);
							return;
						}

						this.pendingResolve = null;
						this.onApiError(error);
						this.lastResults = [];
						resolve([]);
					}
				})();
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

	onClose(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		if (this.pendingResolve) {
			this.pendingResolve([]);
			this.pendingResolve = null;
		}
		super.onClose();
	}
}

function formatCitationCount(count: number): string {
	if (count >= 1000) {
		return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
	}
	return String(count);
}
