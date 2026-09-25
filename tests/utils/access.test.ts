import { describe, it, expect } from "vitest";
import {
	normalizeTier,
	getCitationStyleOptions,
	getUsedQuota,
	formatQuotaLabel,
	formatAccessSummary,
	type QuotaInfo,
} from "../../src/utils/access";
import { CITATION_STYLES } from "../../src/utils/constants";

function quota(partial: Partial<QuotaInfo>): QuotaInfo {
	return {
		used: null,
		limit: null,
		remaining: null,
		tier: null,
		window: null,
		...partial,
	};
}

describe("normalizeTier", () => {
	it("returns 'anonymous' for null/undefined", () => {
		expect(normalizeTier(null)).toBe("anonymous");
		expect(normalizeTier(undefined)).toBe("anonymous");
		expect(normalizeTier("")).toBe("anonymous");
	});

	it("normalizes to lowercase trimmed", () => {
		expect(normalizeTier("  Pro ")).toBe("pro");
		expect(normalizeTier("FREE")).toBe("free");
	});
});

describe("getCitationStyleOptions", () => {
	it("offers every curated style with a plain label", () => {
		// 1.0.0 marked 33 styles "(Pro)" and refused them, although the API
		// formats all curated styles for anonymous callers.
		const options = getCitationStyleOptions();
		expect(options).toHaveLength(Object.keys(CITATION_STYLES).length);
		for (const [, label] of options) {
			expect(label).not.toMatch(/\(Pro\)/);
		}
	});
});

describe("getUsedQuota", () => {
	it("returns null for null/undefined quota", () => {
		expect(getUsedQuota(null)).toBeNull();
		expect(getUsedQuota(undefined)).toBeNull();
	});

	it("returns used when present", () => {
		expect(getUsedQuota(quota({ used: 5, limit: 20, remaining: 15 }))).toBe(5);
	});

	it("computes used from limit - remaining", () => {
		expect(getUsedQuota(quota({ limit: 20, remaining: 15 }))).toBe(5);
	});

	it("returns null when insufficient data", () => {
		expect(getUsedQuota(quota({}))).toBeNull();
	});
});

describe("formatQuotaLabel", () => {
	it("returns Pro label for pro tier", () => {
		expect(formatQuotaLabel(quota({ used: 100, tier: "pro" }))).toBe(
			"CiteMe: Pro"
		);
	});

	it("labels the anonymous rolling 24h budget as such", () => {
		expect(
			formatQuotaLabel(
				quota({
					used: 6,
					limit: 500,
					remaining: 494,
					tier: "anonymous",
					window: "day",
				})
			)
		).toBe("CiteMe: 6/500 searches (24h)");
	});

	it("labels a monthly plan quota as monthly", () => {
		expect(
			formatQuotaLabel(
				quota({ used: 5, limit: 20, remaining: 15, tier: "free", window: "month" })
			)
		).toBe("CiteMe: 5/20 citations this month");
	});

	it("returns limit reached when remaining is 0", () => {
		expect(formatQuotaLabel(quota({ remaining: 0 }))).toBe(
			"CiteMe: Limit reached"
		);
	});

	it("returns Free for free tier without usage data", () => {
		expect(formatQuotaLabel(quota({ tier: "free" }))).toBe("CiteMe: Free");
	});

	it("returns Anonymous for unknown tier", () => {
		expect(formatQuotaLabel(null)).toBe("CiteMe: Anonymous");
	});
});

describe("formatAccessSummary", () => {
	it("says no account is needed and how many styles are available", () => {
		const summary = formatAccessSummary(null);
		expect(summary).toContain("No account needed");
		expect(summary).toContain(String(Object.keys(CITATION_STYLES).length));
		expect(summary).not.toMatch(/Pro|sign in|upgrade/i);
	});

	it("reports the 24h usage when the API sent it", () => {
		expect(
			formatAccessSummary(
				quota({
					used: 6,
					limit: 500,
					remaining: 494,
					tier: "anonymous",
					window: "day",
				})
			)
		).toContain("6/500 searches in the last 24 hours");
	});
});
