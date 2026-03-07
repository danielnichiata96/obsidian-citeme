/**
 * Citation styles — synced with citeme SaaS style-loader.ts.
 * Excludes export formats (bibtex, ris) which are not citation styles.
 */
export const CITATION_STYLES: Record<string, string> = {
	// Brazil
	abnt: "ABNT",
	"abnt-numerico": "ABNT (Numeric)",

	// USA
	apa: "APA (7th edition)",
	mla: "MLA (9th edition)",
	"chicago-author-date": "Chicago (Author-Date)",
	"chicago-note": "Chicago (Note)",
	turabian: "Turabian",
	ieee: "IEEE",
	ama: "AMA",
	asa: "ASA",
	bluebook: "Bluebook",
	cse: "CSE",
	acs: "ACS",

	// UK
	harvard: "Harvard",
	vancouver: "Vancouver",
	oscola: "OSCOLA",
	mhra: "MHRA",
	bmj: "BMJ",
	"elsevier-harvard": "Elsevier Harvard",
	"sage-harvard": "SAGE Harvard",
	"taylor-francis": "Taylor & Francis",
	"cambridge-university-press": "Cambridge UP",
	"royal-society": "Royal Society",

	// Germany
	"din-1505": "DIN 1505-2",
	"iso690-de": "ISO 690 (German)",

	// France
	"iso690-fr": "ISO 690 (French)",

	// International
	iso690: "ISO 690",
	nature: "Nature",

	// High-Impact Journals
	plos: "PLOS",
	science: "Science",
	cell: "Cell",
	lancet: "The Lancet",

	// Sciences
	aip: "AIP",
	rsc: "RSC",

	// Social Sciences
	apsa: "APSA",
	aaa: "AAA",

	// Portugal
	np405: "NP 405",

	// Spain
	"iso690-es": "ISO 690 (Spanish)",

	// South Africa
	"harvard-uct": "Harvard (UCT)",

	// Australia
	aglc: "AGLC4",
	"harvard-agps": "Harvard (AGPS)",

	// Asia
	"vancouver-author-date": "Vancouver (Author-Date)",

	// Canada
	mcgill: "McGill Guide",
};

/**
 * Free tier styles — synced with citeme SaaS plans/config.ts FREE_STYLES.
 */
export const FREE_TIER_STYLES = [
	"apa",
	"mla",
	"chicago-author-date",
	"vancouver",
	"harvard",
	"ieee",
	"chicago-note",
	"ama",
	"acs",
	"abnt",
] as const;

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
	inText: "In-text citation (Author, Year)",
	inTextNarrative: "Narrative citation: Author (Year)",
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

export const CITEME_SOURCE_HEADER = "obsidian-plugin";
export const CITEME_APP_URL = "https://citeme.app";
export const CITEME_PRICING_URL = "https://citeme.app/pricing";
