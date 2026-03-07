import { describe, it, expect } from "vitest";
import {
	normalizeTier,
	canUseStyle,
	isProStyle,
	getCitationStyleLabel,
	getUsedQuota,
	formatQuotaLabel,
	formatAccessSummary,
} from "../../src/utils/access";

describe("normalizeTier", () => {
	it("returns 'anonymous' for null/undefined", () => {
		expect(normalizeTier(null)).toBe("anonymous");
		expect(normalizeTier(undefined)).toBe("anonymous");
		expect(normalizeTier("")).toBe("anonymous");
	});

	it("normalizes to lowercase trimmed", () => {
		expect(normalizeTier("Pro")).toBe("pro");
		expect(normalizeTier("  Free  ")).toBe("free");
	});
});

describe("canUseStyle", () => {
	it("allows any style for pro tier", () => {
		expect(canUseStyle("nature", "pro")).toBe(true);
		expect(canUseStyle("apa", "pro")).toBe(true);
	});

	it("allows free styles for anonymous", () => {
		expect(canUseStyle("apa", null)).toBe(true);
		expect(canUseStyle("mla", "free")).toBe(true);
	});

	it("blocks pro styles for non-pro tiers", () => {
		expect(canUseStyle("nature", null)).toBe(false);
		expect(canUseStyle("nature", "free")).toBe(false);
	});

	it("returns true for empty style", () => {
		expect(canUseStyle("", null)).toBe(true);
	});
});

describe("isProStyle", () => {
	it("returns false for free styles", () => {
		expect(isProStyle("apa")).toBe(false);
		expect(isProStyle("ieee")).toBe(false);
		expect(isProStyle("abnt")).toBe(false);
	});

	it("returns true for pro styles", () => {
		expect(isProStyle("nature")).toBe(true);
		expect(isProStyle("cell")).toBe(true);
		expect(isProStyle("lancet")).toBe(true);
	});
});

describe("getCitationStyleLabel", () => {
	it("returns label without suffix for accessible style", () => {
		expect(getCitationStyleLabel("apa", "free")).toBe("APA (7th edition)");
	});

	it("appends (Pro) for inaccessible style", () => {
		expect(getCitationStyleLabel("nature", "free")).toBe("Nature (Pro)");
	});

	it("returns plain label for pro tier", () => {
		expect(getCitationStyleLabel("nature", "pro")).toBe("Nature");
	});
});

describe("getUsedQuota", () => {
	it("returns null for null/undefined quota", () => {
		expect(getUsedQuota(null)).toBeNull();
		expect(getUsedQuota(undefined)).toBeNull();
	});

	it("returns used when present", () => {
		expect(
			getUsedQuota({ used: 5, limit: 20, remaining: 15, tier: "free" })
		).toBe(5);
	});

	it("computes used from limit - remaining", () => {
		expect(
			getUsedQuota({
				used: null,
				limit: 20,
				remaining: 15,
				tier: "free",
			})
		).toBe(5);
	});

	it("returns null when insufficient data", () => {
		expect(
			getUsedQuota({
				used: null,
				limit: null,
				remaining: null,
				tier: null,
			})
		).toBeNull();
	});
});

describe("formatQuotaLabel", () => {
	it("returns Pro label for pro tier", () => {
		expect(
			formatQuotaLabel({
				used: 100,
				limit: null,
				remaining: null,
				tier: "pro",
			})
		).toBe("CiteMe: Pro");
	});

	it("returns usage label when data available", () => {
		expect(
			formatQuotaLabel({
				used: 5,
				limit: 20,
				remaining: 15,
				tier: "free",
			})
		).toBe("CiteMe: 5/20 citations");
	});

	it("returns limit reached when remaining is 0", () => {
		expect(
			formatQuotaLabel({
				used: null,
				limit: null,
				remaining: 0,
				tier: null,
			})
		).toBe("CiteMe: Limit reached");
	});

	it("returns Free for free tier without usage data", () => {
		expect(
			formatQuotaLabel({
				used: null,
				limit: null,
				remaining: null,
				tier: "free",
			})
		).toBe("CiteMe: Free");
	});

	it("returns Anonymous for unknown tier", () => {
		expect(formatQuotaLabel(null)).toBe("CiteMe: Anonymous");
	});
});

describe("formatAccessSummary", () => {
	it("returns pro message for pro tier", () => {
		expect(
			formatAccessSummary({
				used: null,
				limit: null,
				remaining: null,
				tier: "pro",
			})
		).toContain("Pro unlocked");
	});

	it("returns anonymous message for null", () => {
		expect(formatAccessSummary(null)).toContain("Anonymous");
	});
});
