import { describe, it, expect } from "vitest";
import { CITATION_STYLES, FREE_TIER_STYLES } from "../../src/utils/constants";
import {
	hasLiveSaasContract,
	loadLiveSaasContract,
	loadSaasContract,
	loadSnapshotSaasContract,
} from "./saas-contract-source";

/**
 * SaaS parity tests.
 *
 * When the sibling repo `../citeme` exists, these tests read the live
 * SaaS source files directly. In isolated CI environments, they fall back
 * to the checked-in snapshot under `tests/contracts/saas-contract.snapshot.json`.
 */

const saasContract = loadSaasContract();

describe("Style parity with SaaS", () => {
	if (hasLiveSaasContract()) {
		it("checked-in snapshot matches the live SaaS source", () => {
			expect(loadSnapshotSaasContract()).toEqual(loadLiveSaasContract());
		});
	}

	it("plugin has exactly the citation styles exposed by the SaaS", () => {
		expect(Object.keys(CITATION_STYLES)).toHaveLength(
			saasContract.styleSlugs.length
		);
	});

	it("plugin styles match SaaS style slugs exactly", () => {
		const pluginSlugs = Object.keys(CITATION_STYLES).sort();
		expect(pluginSlugs).toEqual(saasContract.styleSlugs);
	});

	it("plugin has exactly the free tier styles exposed by the SaaS", () => {
		expect(FREE_TIER_STYLES).toHaveLength(
			saasContract.freeStyles.length
		);
	});

	it("free tier styles match SaaS FREE_STYLES exactly", () => {
		const pluginFree = [...FREE_TIER_STYLES].sort();
		expect(pluginFree).toEqual(saasContract.freeStyles);
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
