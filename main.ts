import { Editor, MarkdownView, Notice, Plugin, normalizePath } from "obsidian";
import { CitationResult, CiteMeApiError, checkReferences } from "./src/api";
import { CiteMeCheckModal } from "./src/modals/check-modal";
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
	buildCitationNoteMarkdown,
	suggestCitationNoteBaseName,
} from "./src/utils/note-template";
import { extractReferencesForCheck } from "./src/utils/reference-check";
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
			id: "insert-as-new-note",
			name: "Insert as new note",
			callback: () => {
				this.openSearchModalForNewNote();
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

		this.addCommand({
			id: "check-references",
			name: "Check references in this note",
			editorCallback: (editor: Editor) => {
				this.checkReferences(editor);
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
					menu.addItem((item) => {
						item.setTitle("Check selected references")
							.setIcon("search-check")
							.onClick(() => {
								this.checkReferences(editor);
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

	private openSearchModalForNewNote(initialQuery?: string): void {
		new CiteMeSearchModal(
			this.app,
			this.settings,
			(result: CitationResult) => {
				void this.createCitationNote(result);
			},
			(quota) => this.updateQuotaInfo(quota),
			(error) => this.handleApiError(error),
			initialQuery
		).open();
	}

	/** Check the selection, or the References section when nothing is selected. */
	private checkReferences(editor: Editor): void {
		const heading = this.settings.referencesHeading;
		const text =
			editor.getSelection().trim() ||
			extractReferencesForCheck(editor.getValue(), heading);
		if (!text) {
			new Notice(
				`Select the references to check, or add a "${heading}" section to this note.`
			);
			return;
		}

		const { apiBaseUrl, apiToken } = this.settings;
		new CiteMeCheckModal(
			this.app,
			() => checkReferences(text, apiBaseUrl, apiToken),
			apiToken.trim() !== ""
		).open();
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

	private async createCitationNote(result: CitationResult): Promise<void> {
		try {
			await this.ensureCitationNotesFolder();
			const noteBaseName = suggestCitationNoteBaseName(result.paper);
			const notePath = this.nextAvailableNotePath(noteBaseName);
			const content = buildCitationNoteMarkdown(
				result,
				this.settings.citationNoteTag
			);

			const file = await this.app.vault.create(notePath, content);
			await this.app.workspace.getLeaf(true).openFile(file);
			new Notice(`Created note: ${file.path}`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			new Notice(`CiteMe: Could not create the note - ${message}`);
		}
	}

	private nextAvailableNotePath(baseName: string): string {
		const prefix = `${normalizePath(this.settings.citationNotesFolder)}/`;
		let candidate = normalizePath(`${prefix}${baseName}.md`);
		let suffix = 2;

		while (this.app.vault.getAbstractFileByPath(candidate)) {
			candidate = normalizePath(`${prefix}${baseName} (${suffix}).md`);
			suffix++;
		}

		return candidate;
	}

	private async ensureCitationNotesFolder(): Promise<void> {
		const folder = normalizePath(this.settings.citationNotesFolder);
		if (this.app.vault.getAbstractFileByPath(folder)) {
			return;
		}

		const parts = folder.split("/").filter(Boolean);
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
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
