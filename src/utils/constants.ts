export const CITATION_STYLES: Record<string, string> = {
	apa: "APA (7th edition)",
	"apa-6": "APA (6th edition)",
	"apa-fr": "APA (French)",
	mla: "MLA (9th edition)",
	"mla-8": "MLA (8th edition)",
	abnt: "ABNT",
	"abnt-numerico": "ABNT (Numeric)",
	"chicago-author-date": "Chicago (Author-Date)",
	"chicago-note": "Chicago (Note)",
	"chicago-fullnote": "Chicago (Full Note)",
	ieee: "IEEE",
	harvard: "Harvard",
	"elsevier-harvard": "Elsevier Harvard",
	"sage-harvard": "SAGE Harvard",
	vancouver: "Vancouver",
	ama: "AMA",
	acs: "ACS",
	acm: "ACM",
	nature: "Nature",
	science: "Science",
	cell: "Cell",
	oscola: "OSCOLA",
	turabian: "Turabian",
	asa: "ASA",
	bluebook: "Bluebook",
	din: "DIN 1505",
	aist: "AIST",
	mhra: "MHRA",
	"iso-690": "ISO 690",
	gost: "GOST",
	cse: "CSE",
	apsa: "APSA",
	"annual-reviews": "Annual Reviews",
	springer: "Springer",
	"taylor-and-francis": "Taylor & Francis",
	rsc: "Royal Society of Chemistry",
	aip: "AIP",
	aps: "APS",
	"copernicus": "Copernicus",
	"american-physics-society": "American Physics Society",
	"unified-linguistics": "Unified Linguistics",
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
