import { describe, it, expect } from "vitest";
import {
	findHeadingIndex,
	findSectionEnd,
	insertCitation,
} from "../../src/utils/formatter";
import type { CitationResult } from "../../src/utils/citation-result";

/**
 * Minimal stand-in for Obsidian's Editor over a single string buffer. The
 * cursor starts at the end and maps through edits like CodeMirror 6 does: an
 * insertion exactly at the cursor leaves the cursor before the new text.
 */
function fakeEditor(initial = "") {
	let text = initial;
	let cursor = initial.length;
	const offset = (pos: { line: number; ch: number }) => {
		const lines = text.split("\n");
		return (
			lines.slice(0, pos.line).reduce((sum, l) => sum + l.length + 1, 0) +
			pos.ch
		);
	};
	const position = (at: number) => {
		const before = text.slice(0, at).split("\n");
		return { line: before.length - 1, ch: before[before.length - 1].length };
	};
	return {
		getCursor: () => position(cursor),
		setCursor: (pos: { line: number; ch: number }) => {
			cursor = offset(pos);
		},
		posToOffset: offset,
		offsetToPos: position,
		getValue: () => text,
		lastLine: () => text.split("\n").length - 1,
		replaceRange: (insert: string, pos: { line: number; ch: number }) => {
			const at = offset(pos);
			text = text.slice(0, at) + insert + text.slice(at);
			if (at < cursor) cursor += insert.length;
		},
		type: (typed: string) => {
			text = text.slice(0, cursor) + typed + text.slice(cursor);
			cursor += typed.length;
		},
		text: () => text,
	};
}

const result: CitationResult = {
	paper: {
		id: "w1",
		title: "Deep learning",
		authors: ["Yann LeCun"],
		year: 2015,
		doi: "10.1038/nature14539",
		venue: "Nature",
		citationCount: 1,
		abstract: null,
	},
	formatted: {
		reference: "LeCun, Y. (2015). Deep learning. *Nature*.",
		inText: "(LeCun, 2015)",
	},
};

describe("insertCitation", () => {
	it("inserts the reference in the default bibliography mode", () => {
		// 1.0.0 read a `bibliography` field the API never sent and inserted
		// nothing in this, the default, mode.
		const editor = fakeEditor("Intro ");
		insertCitation(editor as never, result, "bibliography", true, "## References");
		expect(editor.text()).toBe("Intro LeCun, Y. (2015). Deep learning. *Nature*.");
	});

	it("puts the in-text citation at the cursor and the reference under References", () => {
		const editor = fakeEditor("Claim ");
		insertCitation(editor as never, result, "both", true, "## References");
		expect(editor.text()).toContain("Claim (LeCun, 2015)");
		expect(editor.text()).toContain(
			"## References\n\nLeCun, Y. (2015). Deep learning. *Nature*."
		);
	});

	it.each(["bibliography", "inText", "both"] as const)(
		"leaves the cursor after the inserted citation in %s mode",
		(format) => {
			// Obsidian kept the cursor before the inserted text, so the next
			// keystroke landed in front of the citation.
			const editor = fakeEditor("Claim ");
			insertCitation(editor as never, result, format, true, "## References");
			editor.type(".");
			const inserted =
				format === "bibliography"
					? result.formatted.reference
					: result.formatted.inText;
			expect(editor.text()).toContain(`Claim ${inserted}.`);
		}
	);
});


describe("findHeadingIndex", () => {
	it("finds heading at correct line", () => {
		const lines = ["# Title", "", "## References", "entry1"];
		expect(findHeadingIndex(lines, "## References")).toBe(2);
	});

	it("returns -1 when heading not found", () => {
		const lines = ["# Title", "", "Some text"];
		expect(findHeadingIndex(lines, "## References")).toBe(-1);
	});

	it("matches case-insensitively", () => {
		const lines = ["## references"];
		expect(findHeadingIndex(lines, "## References")).toBe(0);
	});

	it("matches by heading level", () => {
		const lines = ["### References"];
		expect(findHeadingIndex(lines, "## References")).toBe(-1);
	});
});

describe("findSectionEnd", () => {
	it("returns lines.length when no next heading", () => {
		const lines = ["## References", "entry"];
		expect(findSectionEnd(lines, 0)).toBe(2);
	});

	it("stops at same-level heading", () => {
		const lines = ["## References", "entry", "## Notes"];
		expect(findSectionEnd(lines, 0)).toBe(2);
	});

	it("stops at higher-level heading", () => {
		const lines = ["## References", "entry", "# Top"];
		expect(findSectionEnd(lines, 0)).toBe(2);
	});

	it("does not stop at lower-level heading", () => {
		const lines = ["## References", "entry", "### Sub", "more"];
		expect(findSectionEnd(lines, 0)).toBe(4);
	});
});
