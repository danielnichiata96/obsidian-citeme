import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { CitationResult, CiteMeApiError } from "./src/api";
import { CiteMeSearchModal } from "./src/modals/search-modal";
import { CiteMeDoiModal } from "./src/modals/doi-modal";
import { CiteMeResultModal } from "./src/modals/result-modal";
import { CiteMeSettingTab } from "./src/settings";
import {
	formatAccessSummary,
	formatQuotaLabel,
	getUsedQuota,
	type QuotaInfo,
} from "./src/utils/access";
import { insertCitation, InsertFormat } from "./src/utils/formatter";
import {
	type CiteMeSettings,
	normalizeSettings,
} from "./src/utils/settings-migration";

export default class CiteMePlugin extends Plugin {
	settings: CiteMeSettings = normalizeSettings(null);
	private statusBarEl: HTMLElement | null = null;
	private quotaInfo: QuotaInfo | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.statusBarEl = this.addStatusBarItem();
		this.updateStatusBar();

		this.addCommand({
			id: "search-citations",
			name: "Search citations",
			editorCallback: (editor: Editor) => {
				this.openSearchModal(editor);
			},
		});

		this.addCommand({
			id: "insert-intext-citation",
			name: "Insert citation (in-text)",
			editorCallback: (editor: Editor) => {
				this.openSearchModal(editor, undefined, "inText");
			},
		});

		this.addCommand({
			id: "search-by-doi",
			name: "Search by DOI",
			editorCallback: (editor: Editor) => {
				this.openDoiModal(editor);
			},
		});

		this.addCommand({
			id: "search-selected-text",
			name: "Search citation for selected text",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("No text selected");
					return;
				}
				this.openSearchModal(editor, selection);
			},
		});

		this.addRibbonIcon("book-open", "CiteMe: search citations", () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) {
				new Notice("Open a note to insert citations");
				return;
			}
			this.openSearchModal(view.editor);
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				const selection = editor.getSelection();
				if (selection) {
					menu.addItem((item) => {
						item.setTitle("Search citation for selected text")
							.setIcon("book-open")
							.onClick(() => {
								this.openSearchModal(editor, selection);
							});
					});
				}

				menu.addItem((item) => {
					item.setTitle("CiteMe: search citations")
						.setIcon("book-open")
						.onClick(() => {
							this.openSearchModal(editor);
						});
				});
			})
		);

		this.addSettingTab(new CiteMeSettingTab(this.app, this));
	}

	private openSearchModal(
		editor: Editor,
		initialQuery?: string,
		formatOverride?: InsertFormat
	): void {
		const modal = new CiteMeSearchModal(
			this.app,
			this.settings,
			(result: CitationResult) => {
				const format =
					modal.getFormatOverride() || this.settings.insertFormat;
				this.handleCitationChoice(editor, result, format);
			},
			(quota) => this.updateQuotaInfo(quota),
			(error) => this.handleApiError(error),
			initialQuery,
			formatOverride
		);
		modal.open();
	}

	private openDoiModal(editor: Editor): void {
		new CiteMeDoiModal(
			this.app,
			this.settings,
			(result: CitationResult) => {
				new CiteMeResultModal(this.app, result, (chosen) => {
					this.handleCitationChoice(
						editor,
						chosen,
						this.settings.insertFormat
					);
				}).open();
			},
			(quota) => this.updateQuotaInfo(quota),
			(error) => this.handleApiError(error)
		).open();
	}

	private handleCitationChoice(
		editor: Editor,
		result: CitationResult,
		format: InsertFormat
	): void {
		insertCitation(
			editor,
			result,
			format,
			this.settings.addToReferencesSection,
			this.settings.referencesHeading
		);
		new Notice(`Inserted: ${result.paper.title}`);
	}

	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getAccessSummary(): string {
		return formatAccessSummary(this.quotaInfo);
	}

	private updateQuotaInfo(quota: QuotaInfo): void {
		const previousRemaining = this.quotaInfo?.remaining ?? null;
		this.quotaInfo = {
			used: quota.used ?? this.quotaInfo?.used ?? null,
			limit: quota.limit ?? this.quotaInfo?.limit ?? null,
			remaining: quota.remaining ?? this.quotaInfo?.remaining ?? null,
			tier: quota.tier ?? this.quotaInfo?.tier ?? null,
			window: quota.window ?? this.quotaInfo?.window ?? null,
		};
		this.updateStatusBar();

		if (this.quotaInfo.remaining === 0 && previousRemaining !== 0) {
			this.showQuotaExceededNotice();
		}
	}

	private updateStatusBar(): void {
		if (!this.statusBarEl) {
			return;
		}

		this.statusBarEl.setText(formatQuotaLabel(this.quotaInfo));
		this.statusBarEl.setAttribute("aria-label", this.getAccessSummary());
		this.statusBarEl.title = this.getAccessSummary();
	}

	private handleApiError(error: unknown): void {
		if (error instanceof CiteMeApiError) {
			if (error.quota) {
				this.updateQuotaInfo(error.quota);
			}

			if (error.code === "quota_exceeded") {
				this.showQuotaExceededNotice();
				return;
			}

			new Notice(`CiteMe: ${error.message}`);
			return;
		}

		const message =
			error instanceof Error ? error.message : "Unknown error";
		new Notice(`CiteMe: Search failed - ${message}`);
	}

	private showQuotaExceededNotice(): void {
		// The plugin sends no credentials, so an account would not raise this
		// limit — say what happened and when it clears, nothing more.
		const used = getUsedQuota(this.quotaInfo);
		const limit = this.quotaInfo?.limit;
		const period =
			this.quotaInfo?.window === "month"
				? "this month"
				: "in the last 24 hours";
		const usage =
			used !== null && limit !== null
				? `CiteMe search limit reached (${used}/${limit} ${period}).`
				: "CiteMe search limit reached.";
		new Notice(`${usage} Try again later.`, 8000);
	}
}
