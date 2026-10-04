import { describe, it, expect } from "vitest";
import liveResponse from "../fixtures/reference-check-response.json";
import {
	ANONYMOUS_CHECKS_PER_MONTH,
	ANONYMOUS_REFERENCES_PER_CHECK,
	REFERENCE_STATUSES,
	REVIEW_ISSUE_CODES,
	VERIFICATION_KINDS,
	classifyReference,
	countVerdicts,
	describeReferenceCheckFailure,
	extractReferencesForCheck,
	normalizeReferenceCheckResponse,
	type CheckedReference,
} from "../../src/utils/reference-check";
import { loadSaasContract } from "../contracts/saas-contract-source";

const saasContract = loadSaasContract();

function reference(overrides: Partial<CheckedReference>): CheckedReference {
	return {
		index: 1,
		rawText: "Doe, J. (2020). A title. Journal.",
		status: "verified",
		source: "crossref",
		parsed: { title: "A title" },
		found: { title: "A title", doi: "10.1/x" },
		structuredIssues: [],
		likelyHallucinated: false,
		verificationKind: "indexed",
		...overrides,
	};
}

describe("reference-check contract", () => {
	it("knows every status and verification kind the checker reports", () => {
		expect([...REFERENCE_STATUSES].sort()).toEqual(
			saasContract.referenceCheck.statuses
		);
		expect([...VERIFICATION_KINDS].sort()).toEqual(
			saasContract.referenceCheck.verificationKinds
		);
	});

	it("demotes matched references on the same issue codes as the web app", () => {
		expect([...REVIEW_ISSUE_CODES].sort()).toEqual(
			saasContract.referenceCheck.reviewIssueCodes
		);
	});
});

describe("normalizeReferenceCheckResponse", () => {
	it("reads a live response from POST /api/v1/reference-check", () => {
		const { report, quota } = normalizeReferenceCheckResponse(liveResponse);
		expect(report.references).toHaveLength(3);
		expect(report.references[0].found?.doi).toBe("10.1038/nrn2762");
		expect(quota).toEqual({
			tier: "anonymous",
			monthlyLimit: 5,
			monthlyRemaining: 1,
			dailyLimit: 3,
			dailyRemaining: 2,
		});
	});

	it("rejects a body without a report", () => {
		expect(() =>
			normalizeReferenceCheckResponse({ success: true, data: {} })
		).toThrow();
	});
});

describe("classifyReference", () => {
	it("classifies the live report: two found, one not found", () => {
		const { report } = normalizeReferenceCheckResponse(liveResponse);
		expect(report.references.map(classifyReference)).toEqual([
			"found",
			"found",
			"not-found",
		]);
	});

	it.each([
		[{ verificationKind: "retracted" as const }, "retracted"],
		[{ found: { title: "t", isRetracted: true } }, "retracted"],
		[{ status: "unverified" as const, likelyHallucinated: true }, "possibly-fabricated"],
		[{ status: "unverified" as const, verificationKind: "suspicious" as const }, "possibly-fabricated"],
		[{ status: "unverified" as const, verificationKind: "grey-literature" as const }, "grey-literature"],
		[{ status: "partial-match" as const }, "partial"],
		[{ status: "unverified" as const, verificationKind: "not-found" as const, found: null }, "not-found"],
		[{ structuredIssues: [{ code: "doi_mismatch", field: "doi", message: "DOI differs" }] }, "doi-differs"],
		[{ structuredIssues: [{ code: "year_mismatch", field: "year", message: "Year differs" }] }, "found"],
	])("%j → %s", (overrides, verdict) => {
		expect(classifyReference(reference(overrides))).toBe(verdict);
	});
});

describe("countVerdicts", () => {
	it("groups verdicts into found, needs review and not found", () => {
		expect(
			countVerdicts([
				reference({}),
				reference({ status: "partial-match" }),
				reference({ verificationKind: "retracted" }),
				reference({ status: "unverified", found: null, verificationKind: "not-found" }),
				reference({ status: "unverified", likelyHallucinated: true }),
			])
		).toEqual({ found: 1, review: 2, notFound: 2 });
	});
});

describe("extractReferencesForCheck", () => {
	const note = [
		"## Systems consolidation",
		"",
		"Sleep matters (Diekelmann & Born, 2010).",
		"",
		"## References",
		"",
		"Diekelmann, S., & Born, J. (2010). The memory function of sleep.",
		"",
		"Girardeau, G. (2021). Brain neural patterns.",
		"",
		"## Notes",
		"",
		"Not a reference.",
	].join("\n");

	it("returns the entries under the References heading", () => {
		expect(extractReferencesForCheck(note, "## References")).toBe(
			"Diekelmann, S., & Born, J. (2010). The memory function of sleep.\n\nGirardeau, G. (2021). Brain neural patterns."
		);
	});

	it("matches the heading the user configured", () => {
		const bibliography = note.replace("## References", "### Bibliography");
		expect(extractReferencesForCheck(bibliography, "### Bibliography")).toContain(
			"Girardeau"
		);
	});

	it("returns null when the note has no references section", () => {
		expect(extractReferencesForCheck("Just text.", "## References")).toBeNull();
	});

	it("leaves footnote definitions at the end of the note out", () => {
		const withFootnotes = `${note.split("## Notes")[0]}[^1]: Interview with the author, 2023.`;
		expect(extractReferencesForCheck(withFootnotes, "## References")).not.toContain(
			"[^1]"
		);
	});

	it("stops at the next heading when the References heading is indented", () => {
		const indented = note.replace("## References", "  ## References");
		expect(extractReferencesForCheck(indented, "## References")).not.toContain(
			"Not a reference"
		);
	});

	it("returns null when the section is empty", () => {
		expect(
			extractReferencesForCheck("## References\n\n## Notes\nx", "## References")
		).toBeNull();
	});
});

describe("describeReferenceCheckFailure", () => {
	const body = (code: string, message: string, details?: unknown) =>
		JSON.stringify({ success: false, error: { code, message, details } });

	it("pins the anonymous limits it explains to the web app's", () => {
		expect(ANONYMOUS_REFERENCES_PER_CHECK).toBe(
			saasContract.referenceCheck.anonymousReferencesPerCheck
		);
		expect(ANONYMOUS_CHECKS_PER_MONTH).toBe(
			saasContract.referenceCheck.anonymousChecksPerMonth
		);
	});

	it("explains the 10-reference cap and points to a token", () => {
		const failure = describeReferenceCheckFailure(
			403,
			body("QUOTA_EXCEEDED", "Anonymous users are limited to 10 references per check."),
			false
		);
		expect(failure.action).toBe("add-token");
		expect(failure.message).toContain("10 references");
	});

	it("tells an anonymous network it used this month's checks", () => {
		const failure = describeReferenceCheckFailure(
			429,
			body("RATE_LIMIT_EXCEEDED", "Monthly reference check limit reached (5/month).", {
				scope: "monthly",
				quota: { tier: "anonymous" },
			}),
			false
		);
		expect(failure.action).toBe("add-token");
		expect(failure.message).toContain("5 free checks");
	});

	it("offers Pro when a free account runs out", () => {
		const failure = describeReferenceCheckFailure(
			429,
			body("RATE_LIMIT_EXCEEDED", "Monthly reference check limit reached (3/month).", {
				scope: "monthly",
				quota: { tier: "free" },
			}),
			false
		);
		expect(failure.action).toBe("upgrade");
	});

	it("reports a rejected token", () => {
		const failure = describeReferenceCheckFailure(
			401,
			body("UNAUTHORIZED", "Invalid or expired token"),
			true
		);
		expect(failure.action).toBe("replace-token");
	});

	it("falls back to the server's message", () => {
		const failure = describeReferenceCheckFailure(
			500,
			body("INTERNAL_ERROR", "Reference checking is temporarily unavailable."),
			false
		);
		expect(failure).toEqual({
			action: null,
			message: "Reference checking is temporarily unavailable.",
		});
	});

	// The server serves an unrecognized token the anonymous limits instead of
	// a 401, so the anonymous errors are how a bad token shows up.
	it.each([
		[403, body("QUOTA_EXCEEDED", "Anonymous users are limited to 10 references per check.")],
		[
			429,
			body("RATE_LIMIT_EXCEEDED", "Monthly reference check limit reached (5/month).", {
				scope: "monthly",
				quota: { tier: "anonymous" },
			}),
		],
	])("asks to replace a token the server ignored (%s)", (status, errorBody) => {
		const failure = describeReferenceCheckFailure(status, errorBody, true);
		expect(failure.action).toBe("replace-token");
		expect(failure.message).toContain("did not recognize");
	});

	it("explains a selection too short to check", () => {
		const failure = describeReferenceCheckFailure(
			400,
			body("VALIDATION_MIN_LENGTH", "Too small: expected string to have >=10 characters"),
			false
		);
		expect(failure.message).not.toContain("Too small");
		expect(failure.message).toContain("full reference");
	});
});
