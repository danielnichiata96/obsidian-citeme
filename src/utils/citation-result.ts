/**
 * The one boundary between the CiteMe API's JSON and the plugin. Everything
 * downstream (modals, insertion, References section) works on the normalized
 * shape below, never on raw response fields.
 *
 * Kept free of `obsidian` imports so tests can run it in Node.
 * Contract: tests/contracts/api-contract.test.ts.
 */
import { htmlToMarkdown } from "./html-to-markdown";

export interface Paper {
	id: string;
	title: string;
	/** Author display names. */
	authors: string[];
	year: number | null;
	doi: string | null;
	venue: string | null;
	citationCount: number;
	abstract: string | null;
}

/** Both values are Markdown, ready to insert into a note. */
export interface FormattedCitation {
	reference: string;
	inText: string;
}

export interface CitationResult {
	paper: Paper;
	formatted: FormattedCitation;
}

/** `formatted` fields the plugin reads; pinned to the API's ApiFormattedCitation. */
export const FORMATTED_FIELDS = ["reference", "inText"] as const;

export function normalizeCitationResult(raw: unknown): CitationResult {
	const record = asRecord(raw);
	const paper = asRecord(record.paper);
	const formatted = asRecord(record.formatted);

	return {
		paper: {
			id: asString(paper.id) ?? "",
			title: asString(paper.title) ?? "",
			authors: authorNames(paper.authors),
			year: typeof paper.year === "number" ? paper.year : null,
			doi: asString(paper.doi),
			venue: asString(paper.venue),
			citationCount:
				typeof paper.citationCount === "number"
					? paper.citationCount
					: 0,
			abstract: asString(paper.abstract),
		},
		formatted: {
			reference: htmlToMarkdown(asString(formatted.reference) ?? ""),
			inText: htmlToMarkdown(asString(formatted.inText) ?? ""),
		},
	};
}

/** "A, B, C" for up to three authors, "A et al." beyond that. */
export function formatAuthorList(authors: string[]): string {
	return authors.length > 3 ? `${authors[0]} et al.` : authors.join(", ");
}

function authorNames(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const names: string[] = [];
	for (const author of value) {
		const name =
			typeof author === "string"
				? author
				: asString(asRecord(author).name);
		if (name) names.push(name);
	}
	return names;
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

function asString(value: unknown): string | null {
	return typeof value === "string" && value !== "" ? value : null;
}
