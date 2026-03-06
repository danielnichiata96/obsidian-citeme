import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { CitationResult } from "./src/api";
import { CiteMeSearchModal } from "./src/modals/search-modal";
import { CiteMeDoiModal } from "./src/modals/doi-modal";
import { CiteMeResultModal } from "./src/modals/result-modal";
import {
	CiteMeSettings,
	CiteMeSettingTab,
	getDefaultSettings,
} from "./src/settings";
import { insertCitation, InsertFormat } from "./src/utils/formatter";

export default class CiteMePlugin extends Plugin {
	settings: CiteMeSettings = getDefaultSettings();

	async onload(): Promise<void> {
		await this.loadSettings();

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

		this.addRibbonIcon("book-open", "CiteMe: Search citations", () => {
			const view =
				this.app.workspace.getActiveViewOfType(MarkdownView);
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
					item.setTitle("CiteMe: Search citations")
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
			}
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
		this.settings = Object.assign(
			getDefaultSettings(),
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
