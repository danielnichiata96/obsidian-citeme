import { describe, it, expect } from "vitest";
import {
	FORMATTED_FIELDS,
	normalizeCitationResult,
} from "../../src/utils/citation-result";
import {
	hasLiveSaasContract,
	loadLiveSaasContract,
	loadSaasContract,
	loadSnapshotSaasContract,
} from "./saas-contract-source";

/**
 * v1.0.0 shipped reading `formatted.bibliography`, `formatted.inTextNarrative`
 * and `authors: string[]`. The API returns `formatted.reference`,
 * `formatted.inText` and `authors: [{ name, orcid?, affiliations? }]`, so the
 * default insert mode inserted nothing and authors rendered as
 * "[object Object]". These tests pin the plugin to the web app's source.
 */

const saasContract = loadSaasContract();

// One result exactly as GET /api/v1/cite returned it on 2026-09-25.
const liveResult = {
	paper: {
		id: "https://openalex.org/W1234",
		title: "Deep learning",
		authors: [
			{ name: "Yann LeCun", orcid: "0000-0002-1992-2684", affiliations: ["NYU"] },
			{ name: "Yoshua Bengio", affiliations: [] },
			{ name: "Geoffrey E. Hinton" },
		],
		year: 2015,
		venue: "Nature",
		doi: "10.1038/nature14539",
		url: "https://doi.org/10.1038/nature14539",
		citationCount: 60000,
		abstract: null,
	},
	formatted: {
		reference:
			'LeCun, Y., Bengio, Y., &amp; Hinton, G. E. (2015). Deep learning. <span style="font-style: italic;">Nature</span>, <span style="font-style: italic;">521</span>(7553), 436–444. https://doi.org/<a href="https://doi.org/10.1038/nature14539">10.1038/nature14539</a>',
		inText: "(LeCun et al., 2015)",
	},
};

describe("CiteMe API contract", () => {
	if (hasLiveSaasContract()) {
		it("checked-in snapshot matches the live SaaS source", () => {
			expect(loadSnapshotSaasContract()).toEqual(loadLiveSaasContract());
		});
	}

	it("reads only formatted fields the API guarantees", () => {
		for (const field of FORMATTED_FIELDS) {
			expect(saasContract.formattedFields).toContain(field);
		}
	});

	it("maps a live result to insertable Markdown", () => {
		const result = normalizeCitationResult(liveResult);

		expect(result.formatted.reference).toBe(
			"LeCun, Y., Bengio, Y., & Hinton, G. E. (2015). Deep learning. *Nature*, *521*(7553), 436–444. https://doi.org/10.1038/nature14539"
		);
		expect(result.formatted.inText).toBe("(LeCun et al., 2015)");
	});

	it("reads author names from author objects", () => {
		const result = normalizeCitationResult(liveResult);
		expect(result.paper.authors).toEqual([
			"Yann LeCun",
			"Yoshua Bengio",
			"Geoffrey E. Hinton",
		]);
	});

	it("tolerates missing optional paper fields", () => {
		const result = normalizeCitationResult({
			paper: { id: "x", title: "Untitled", authors: [], year: null },
			formatted: { reference: "Untitled.", inText: "(n.d.)" },
		});
		expect(result.paper).toMatchObject({
			year: null,
			doi: null,
			venue: null,
			citationCount: 0,
			abstract: null,
		});
	});
});
