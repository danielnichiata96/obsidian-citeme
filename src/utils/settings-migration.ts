import { CITATION_STYLES, DEFAULT_SETTINGS, INSERT_FORMATS } from "./constants";

export type InsertFormat = "bibliography" | "inText" | "both";

export interface CiteMeSettings {
	defaultStyle: string;
	defaultLimit: number;
	insertFormat: InsertFormat;
	addToReferencesSection: boolean;
	referencesHeading: string;
	sortBy: "relevance" | "year" | "citations";
	apiBaseUrl: string;
}

/**
 * Merge saved plugin data over the defaults and repair values an older
 * version could have saved:
 * - `inTextNarrative` (1.0.0) never worked — the API has no narrative form.
 * - A style the API no longer offers falls back to the default.
 */
export function normalizeSettings(saved: unknown): CiteMeSettings {
	const settings: CiteMeSettings = {
		...DEFAULT_SETTINGS,
		...(saved && typeof saved === "object"
			? (saved as Partial<CiteMeSettings>)
			: {}),
	};

	if ((settings.insertFormat as string) === "inTextNarrative") {
		settings.insertFormat = "inText";
	} else if (!(settings.insertFormat in INSERT_FORMATS)) {
		settings.insertFormat = DEFAULT_SETTINGS.insertFormat;
	}

	if (!(settings.defaultStyle in CITATION_STYLES)) {
		settings.defaultStyle = DEFAULT_SETTINGS.defaultStyle;
	}

	return settings;
}
