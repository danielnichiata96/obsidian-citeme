/**
 * The 60 curated citation styles the CiteMe API formats, with the web app's
 * display names. Every one is available without an account.
 * Parity with lib/citations/parser/style-loader.ts is enforced by
 * tests/contracts/style-parity.test.ts — run `npm run sync:saas-contract`
 * after the web app's catalog changes.
 */
export const CITATION_STYLES: Record<string, string> = {
	// Popular
	apa: "APA 7th Edition",
	mla: "MLA 9th Edition",
	"chicago-author-date": "Chicago (Author-Date)",
	harvard: "Harvard",
	ieee: "IEEE",
	vancouver: "Vancouver",
	abnt: "ABNT",

	// All other curated styles, by name
	aaa: "AAA",
	"abnt-numerico": "ABNT Numérico",
	acs: "ACS",
	aglc: "AGLC4",
	aip: "AIP",
	ama: "AMA",
	annales: "Annales",
	apsa: "APSA",
	asa: "ASA",
	bluebook: "Bluebook",
	bmj: "BMJ",
	"cambridge-university-press": "Cambridge UP",
	cell: "Cell",
	"chicago-fr": "Chicago (French)",
	"chicago-de": "Chicago (German)",
	"chicago-note": "Chicago (Note)",
	cse: "CSE",
	"din-1505": "DIN 1505-2",
	"din-1505-alphanumeric": "DIN 1505-2 (Alphanumeric)",
	"din-1505-numeric": "DIN 1505-2 (Numeric)",
	"elsevier-harvard": "Elsevier Harvard",
	french4: "French 4",
	"harvard-agps": "Harvard (AGPS)",
	"harvard-de": "Harvard (German)",
	"harvard-uct": "Harvard (UCT)",
	iso690: "ISO 690",
	"iso690-fr": "ISO 690 (French)",
	"iso690-de": "ISO 690 (German)",
	"iso690-es": "ISO 690 (Spanish)",
	"iso690-note-fr": "ISO 690 Note (French)",
	"iso690-numeric-fr": "ISO 690 Numeric (French)",
	"juristische-zitierweise": "Juristische Zitierweise",
	kzfss: "KZfSS",
	"le-tapuscrit-author-date": "Le Tapuscrit (Author-Date)",
	"le-tapuscrit-note": "Le Tapuscrit (Note)",
	mcgill: "McGill Guide",
	mhra: "MHRA",
	nature: "Nature",
	np405: "NP 405",
	oscola: "OSCOLA",
	plos: "PLOS",
	"presses-univ-rennes": "Presses Universitaires de Rennes",
	"royal-society": "Royal Society",
	rsc: "RSC",
	"sage-harvard": "SAGE Harvard",
	science: "Science",
	"springer-medizin-psychologie": "Springer Medizin Psychologie",
	"taylor-francis": "Taylor & Francis",
	lancet: "The Lancet",
	turabian: "Turabian",
	"universite-bordeaux-droit": "Université Bordeaux Droit",
	"vancouver-author-date": "Vancouver (Author-Date)",
	"zeitschrift-fur-soziologie": "Zeitschrift für Soziologie",
};

export const SORT_OPTIONS: Record<string, string> = {
	relevance: "Relevance",
	year: "Year",
	citations: "Citations",
};

export const SOURCE_TYPES: Record<string, string> = {
	auto: "Auto",
	paper: "Paper",
	book: "Book",
	thesis: "Thesis",
};

export const INSERT_FORMATS: Record<string, string> = {
	bibliography: "Full bibliography entry",
	inText: "In-text citation",
	both: "In-text at cursor + bibliography in References",
};

export const DEFAULT_SETTINGS = {
	defaultStyle: "apa",
	defaultLimit: 5,
	insertFormat: "bibliography" as const,
	addToReferencesSection: true,
	referencesHeading: "## References",
	sortBy: "relevance" as const,
	apiBaseUrl: "https://citeme.app",
};

/**
 * Pause after the last keystroke before searching. Each search spends one
 * slot of the anonymous 24h budget, so type-ahead waits for a real pause.
 */
export const SEARCH_DEBOUNCE_MS = 800;

export const CITEME_SOURCE_HEADER = "obsidian-plugin";
export const CITEME_APP_URL = "https://citeme.app";
