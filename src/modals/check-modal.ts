import { App, Modal } from "obsidian";
import { type CheckResponse, ReferenceCheckError } from "../api";
import {
	CITEME_CHECKER_LINK,
	CITEME_PRICING_LINK,
	CITEME_TOKEN_LINK,
} from "../utils/constants";
import {
	type CheckFailure,
	type CheckedReference,
	type ReferenceCheckQuota,
	type ReferenceVerdict,
	VERDICT_LABELS,
	classifyReference,
	countVerdicts,
} from "../utils/reference-check";

const VERDICT_GROUP: Record<ReferenceVerdict, "found" | "review" | "missing"> =
	{
		found: "found",
		"doi-differs": "review",
		partial: "review",
		"grey-literature": "review",
		retracted: "review",
		"not-found": "missing",
		"possibly-fabricated": "missing",
	};

/** Runs one reference check and shows its result or a message to act on. */
export class CiteMeCheckModal extends Modal {
	private run: () => Promise<CheckResponse>;
	private hasToken: boolean;
	private closed = false;

	constructor(
		app: App,
		run: () => Promise<CheckResponse>,
		hasToken: boolean
	) {
		super(app);
		this.run = run;
		this.hasToken = hasToken;
	}

	onOpen(): void {
		this.titleEl.setText("Reference check");
		this.contentEl.addClass("citeme-check-modal");
		this.contentEl.createEl("p", {
			text: "Checking references against scholarly databases. This can take up to a minute.",
			cls: "citeme-check-status",
		});

		this.run().then(
			(response) => {
				if (!this.closed) this.renderReport(response);
			},
			(error: unknown) => {
				if (this.closed) return;
				this.renderFailure(
					error instanceof ReferenceCheckError
						? error.failure
						: {
								action: null,
								message:
									"The reference check failed. Try again.",
							}
				);
			}
		);
	}

	onClose(): void {
		this.closed = true;
		this.contentEl.empty();
	}

	private renderReport({ report, quota }: CheckResponse): void {
		const { contentEl } = this;
		contentEl.empty();

		const counts = countVerdicts(report.references);
		contentEl.createEl("p", {
			text: `${report.references.length} checked: ${counts.found} found, ${counts.review} to review, ${counts.notFound} not found.`,
			cls: "citeme-check-summary",
		});

		if (report.truncated) {
			contentEl.createEl("p", {
				text: `Only the first ${report.references.length} of ${report.totalParsed} references were checked.`,
				cls: "citeme-check-note",
			});
		}
		if (this.hasToken && quota?.tier === "anonymous") {
			contentEl.createEl("p", {
				text: "CiteMe did not recognize the token in the plugin settings, so this check used the free limits.",
				cls: "citeme-check-warning",
			});
		}

		const list = contentEl.createDiv({ cls: "citeme-check-list" });
		for (const ref of report.references) {
			renderReference(list, ref);
		}

		contentEl.createEl("p", {
			text: '"Not found" means CiteMe found no matching record. Real works that are not indexed end up there too, so it does not prove a reference is fabricated. A match does not confirm the year, journal or pages.',
			cls: "citeme-check-note",
		});

		const quotaLine = describeQuota(quota);
		if (quotaLine) {
			contentEl.createEl("p", {
				text: quotaLine,
				cls: "citeme-check-note",
			});
		}

		const buttons = contentEl.createDiv({ cls: "citeme-detail-buttons" });
		addLinkButton(
			buttons,
			"Open the CiteMe reference checker",
			CITEME_CHECKER_LINK
		);
	}

	private renderFailure(failure: CheckFailure): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("p", { text: failure.message });

		const buttons = contentEl.createDiv({ cls: "citeme-detail-buttons" });
		if (
			failure.action === "add-token" ||
			failure.action === "replace-token"
		) {
			addLinkButton(buttons, "Create a CiteMe token", CITEME_TOKEN_LINK);
		} else if (failure.action === "upgrade") {
			addLinkButton(buttons, "See CiteMe Pro", CITEME_PRICING_LINK);
		}
	}
}

function renderReference(parent: HTMLElement, ref: CheckedReference): void {
	const verdict = classifyReference(ref);
	const item = parent.createDiv({ cls: "citeme-check-item" });

	item.createSpan({
		text: VERDICT_LABELS[verdict],
		cls: `citeme-check-badge citeme-check-${VERDICT_GROUP[verdict]}`,
	});
	item.createDiv({
		text: ref.parsed.title || truncate(ref.rawText, 160),
		cls: "citeme-check-title",
	});

	if (verdict === "doi-differs") {
		const issue = ref.structuredIssues?.find(
			(entry) => entry.code === "doi_mismatch"
		);
		if (issue?.written && issue.found) {
			item.createDiv({
				text: `Your DOI: ${issue.written}. Record: ${issue.found}.`,
				cls: "citeme-check-detail",
			});
		}
	}

	const doi = ref.found?.doi;
	if (doi && verdict !== "not-found" && verdict !== "possibly-fabricated") {
		const detail = item.createDiv({ cls: "citeme-check-detail" });
		detail.createEl("a", { text: doi, href: `https://doi.org/${doi}` });
	}
}

function describeQuota(quota: ReferenceCheckQuota | null): string | null {
	if (
		!quota ||
		quota.monthlyRemaining === null ||
		quota.monthlyLimit === null
	) {
		return null;
	}
	const scope = quota.tier === "anonymous" ? " on this network" : "";
	return `Free checks left this month${scope}: ${quota.monthlyRemaining} of ${quota.monthlyLimit}.`;
}

function addLinkButton(parent: HTMLElement, text: string, url: string): void {
	const button = parent.createEl("button", { text });
	button.addEventListener("click", () => {
		window.open(url, "_blank");
	});
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
