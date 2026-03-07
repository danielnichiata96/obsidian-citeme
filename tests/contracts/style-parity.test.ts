import { describe, it, expect } from "vitest";
import { CITATION_STYLES, FREE_TIER_STYLES } from "../../src/utils/constants";

/**
 * Contract tests: ensure the plugin's style and tier constants
 * stay in sync with the CiteMe SaaS.
 *
 * Source of truth:
 *   - styles: citeme/lib/citations/parser/style-loader.ts
 *   - free styles: citeme/lib/plans/config.ts FREE_STYLES
 *
 * When the SaaS adds or removes styles, update these tests.
 */

const SAAS_STYLE_SLUGS = [
	"abnt",
	"abnt-numerico",
	"apa",
	"mla",
	"chicago-author-date",
	"chicago-note",
	"turabian",
	"ieee",
	"ama",
	"asa",
	"bluebook",
	"cse",
	"acs",
	"harvard",
	"vancouver",
	"oscola",
	"mhra",
	"bmj",
	"elsevier-harvard",
	"sage-harvard",
	"taylor-francis",
	"cambridge-university-press",
	"royal-society",
	"din-1505",
	"iso690-de",
	"iso690-fr",
	"iso690",
	"nature",
	"plos",
	"science",
	"cell",
	"lancet",
	"aip",
	"rsc",
	"apsa",
	"aaa",
	"np405",
	"iso690-es",
	"harvard-uct",
	"aglc",
	"harvard-agps",
	"vancouver-author-date",
	"mcgill",
];

const SAAS_FREE_STYLES = [
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
];

describe("Style parity with SaaS", () => {
	it("plugin has exactly 43 citation styles", () => {
		expect(Object.keys(CITATION_STYLES)).toHaveLength(43);
	});

	it("plugin styles match SaaS style slugs exactly", () => {
		const pluginSlugs = Object.keys(CITATION_STYLES).sort();
		const saasSlugs = [...SAAS_STYLE_SLUGS].sort();
		expect(pluginSlugs).toEqual(saasSlugs);
	});

	it("plugin has exactly 10 free tier styles", () => {
		expect(FREE_TIER_STYLES).toHaveLength(10);
	});

	it("free tier styles match SaaS FREE_STYLES exactly", () => {
		const pluginFree = [...FREE_TIER_STYLES].sort();
		const saasFree = [...SAAS_FREE_STYLES].sort();
		expect(pluginFree).toEqual(saasFree);
	});

	it("all free styles exist in CITATION_STYLES", () => {
		for (const style of FREE_TIER_STYLES) {
			expect(CITATION_STYLES).toHaveProperty(style);
		}
	});

	it("every CITATION_STYLES key is a non-empty string slug", () => {
		for (const key of Object.keys(CITATION_STYLES)) {
			expect(key).toMatch(/^[a-z0-9-]+$/);
			expect(CITATION_STYLES[key].length).toBeGreaterThan(0);
		}
	});
});
