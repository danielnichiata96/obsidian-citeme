import { describe, expect, it } from "vitest";
import type { CitationResult } from "../../src/utils/citation-result";
import {
	buildCitationNoteMarkdown,
	sanitizeNoteBaseName,
	suggestCitationNoteBaseName,
	truncateTitle,
} from "../../src/utils/note-template";

const result: CitationResult = {
	paper: {
		id: "paper-123",
		title: "Deep learning: a modern overview",
		authors: ["Yann LeCun", "Yoshua Bengio"],
		authorMetadata: [
			{ name: "Yann LeCun", orcid: "0000-0002-1992-2684" },
			{ name: "Yoshua Bengio", orcid: null },
		],
		year: 2015,
		doi: "10.1038/nature14539",
		venue: "Nature",
		citationCount: 123,
		abstract: "A survey of deep learning methods.",
	},
	formatted: {
		reference: "LeCun, Y. (2015). Deep learning.",
		inText: "(LeCun & Bengio, 2015)",
	},
};

describe("sanitizeNoteBaseName", () => {
	it("removes forbidden characters and collapses whitespace", () => {
		expect(sanitizeNoteBaseName('  Deep/learning:*?  "overview"  ')).toBe(
			"Deep learning overview"
		);
	});

	it("falls back to a default when empty", () => {
		expect(sanitizeNoteBaseName("   ")).toBe("Untitled paper");
	});
});

describe("suggestCitationNoteBaseName", () => {
	it("uses first author last name, title, and year", () => {
		expect(suggestCitationNoteBaseName(result.paper)).toBe(
			"LeCun, Deep learning a modern overview (2015)"
		);
	});
});

describe("truncateTitle", () => {
	it("keeps short titles unchanged", () => {
		expect(truncateTitle("Deep learning")).toBe("Deep learning");
	});

	it("cuts long titles at a word boundary within the byte budget", () => {
		const title = "word ".repeat(60).trim();
		const cut = truncateTitle(title);
		expect(cut.endsWith("…")).toBe(true);
		expect(cut).not.toContain(" …");
		expect(
			new TextEncoder().encode(cut.slice(0, -1)).length
		).toBeLessThanOrEqual(120);
	});

	it("counts bytes, not characters, for multi-byte scripts", () => {
		const cut = truncateTitle("深".repeat(100));
		expect(new TextEncoder().encode(cut).length).toBeLessThanOrEqual(123);
	});

	it("keeps the year in the note name of a long title", () => {
		const name = suggestCitationNoteBaseName({
			...result.paper,
			title: "A very long title ".repeat(20),
		});
		expect(name.endsWith("… (2015)")).toBe(true);
		expect(new TextEncoder().encode(name).length).toBeLessThan(200);
	});
});

describe("buildCitationNoteMarkdown", () => {
	it("builds a markdown note with YAML metadata including abstract", () => {
		const markdown = buildCitationNoteMarkdown(result, "CiteMe");

		expect(markdown).toContain('title: "Deep learning: a modern overview"');
		expect(markdown).toContain('tags:\n  - "CiteMe"');
		expect(markdown).toContain(
			'authors:\n  - "Yann LeCun (0000-0002-1992-2684)"\n  - "Yoshua Bengio"'
		);
		expect(markdown).not.toContain("orcid:");
		expect(markdown).toContain(
			'doi: "https://doi.org/10.1038/nature14539"'
		);
		expect(markdown).toContain('venue: "Nature"');
		expect(markdown).toContain(
			'abstract: "A survey of deep learning methods."'
		);
		expect(markdown).not.toContain("citation_count:");
		expect(markdown).toContain('citeme_paper_id: "paper-123"');
		expect(markdown).not.toContain(
			"> *A survey of deep learning methods.*"
		);
		expect(markdown).not.toContain("# Deep learning: a modern overview");
		expect(markdown).not.toContain("In-text:");
		expect(markdown).not.toContain("Reference:");
	});

	it("writes Unknown when no authors are provided", () => {
		const noAuthors: CitationResult = {
			...result,
			paper: {
				...result.paper,
				authors: [],
				authorMetadata: [],
				abstract: null,
			},
		};

		const markdown = buildCitationNoteMarkdown(noAuthors, "CiteMe");
		expect(markdown).toContain("authors:\n  - Unknown");
		expect(markdown).not.toContain("orcid:");
		expect(markdown).not.toContain("abstract:");
	});

	it("uses the configured tag in frontmatter", () => {
		const markdown = buildCitationNoteMarkdown(result, "literature/citeme");
		expect(markdown).toContain('tags:\n  - "literature/citeme"');
	});
});
