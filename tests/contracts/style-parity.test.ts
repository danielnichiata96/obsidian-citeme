import { describe, it, expect } from "vitest";
import { CITATION_STYLES } from "../../src/utils/constants";
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

	it("offers exactly the curated styles the SaaS formats", () => {
		// v1.0.0 listed 43 of them and locked 33 behind a client-side "Pro"
		// gate the API never applied.
		expect(Object.keys(CITATION_STYLES).sort()).toEqual(
			Object.keys(saasContract.styles).sort()
		);
	});

	it("labels every style with the SaaS display name", () => {
		for (const [slug, name] of Object.entries(saasContract.styles)) {
			expect(CITATION_STYLES[slug]).toBe(name);
		}
	});
});
