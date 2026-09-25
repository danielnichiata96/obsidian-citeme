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
});
