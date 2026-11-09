import { describe, it, expect } from "vitest";
import { normalizeSettings } from "../../src/utils/settings-migration";
import { DEFAULT_SETTINGS } from "../../src/utils/constants";

describe("normalizeSettings", () => {
	it("fills defaults for a fresh install", () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
	});

	it("moves the removed narrative insert mode to in-text", () => {
		// The API never returned a narrative citation; 1.0.0 inserted nothing.
		expect(
			normalizeSettings({ insertFormat: "inTextNarrative" }).insertFormat
		).toBe("inText");
	});

	it("keeps a valid saved style and format", () => {
		const settings = normalizeSettings({
			defaultStyle: "nature",
			insertFormat: "both",
		});
		expect(settings.defaultStyle).toBe("nature");
		expect(settings.insertFormat).toBe("both");
	});

	it("resets a style the API no longer offers", () => {
		expect(normalizeSettings({ defaultStyle: "gone-style" }).defaultStyle).toBe(
			DEFAULT_SETTINGS.defaultStyle
		);
	});

	it("sanitizes citation note folder and tag", () => {
		const settings = normalizeSettings({
			citationNotesFolder: " /Research//CiteMe/ ",
			citationNoteTag: "  literature/citeme  ",
		});
		expect(settings.citationNotesFolder).toBe("Research/CiteMe");
		expect(settings.citationNoteTag).toBe("literature/citeme");
	});

	it("drops a leading # and spaces from the citation note tag", () => {
		const settings = normalizeSettings({
			citationNoteTag: " #literature notes ",
		});
		expect(settings.citationNoteTag).toBe("literature-notes");
	});

	it("falls back when citation note folder or tag are blank", () => {
		const settings = normalizeSettings({
			citationNotesFolder: "   ",
			citationNoteTag: "   ",
		});
		expect(settings.citationNotesFolder).toBe(
			DEFAULT_SETTINGS.citationNotesFolder
		);
		expect(settings.citationNoteTag).toBe(DEFAULT_SETTINGS.citationNoteTag);
	});
});
