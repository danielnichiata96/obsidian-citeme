import { describe, it, expect } from "vitest";
import { findHeadingIndex, findSectionEnd } from "../../src/utils/formatter";

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
