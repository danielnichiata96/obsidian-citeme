import { findHeadingIndex, findSectionEnd } from "./formatter";

/**
 * Client side of CiteMe's reference checker (POST /api/v1/reference-check).
 * The verdict rules mirror the web app's `entry-classification.ts`, and
 * `tests/contracts` pins the values below to its source.
 */

export const REFERENCE_STATUSES = [
	"verified",
	"partial-match",
	"unverified",
] as const;
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

export const VERIFICATION_KINDS = [
	"indexed",
	"web-verified",
	"grey-literature",
	"retracted",
	"not-found",
	"suspicious",
] as const;
export type VerificationKind = (typeof VERIFICATION_KINDS)[number];

/**
 * Issue codes that move a matched reference to "needs review". The web app
 * promotes only a DOI difference: year, title and venue differences fire on
 * too many correct references to be shown as problems.
 */
export const REVIEW_ISSUE_CODES = ["doi_mismatch"] as const;

/** Anonymous limits the checker enforces per network; pinned by tests/contracts. */
export const ANONYMOUS_REFERENCES_PER_CHECK = 10;
export const ANONYMOUS_CHECKS_PER_MONTH = 5;

export interface CheckedReference {
	index: number;
	rawText: string;
	status: ReferenceStatus;
	source: string | null;
	parsed: { title?: string; year?: number; doi?: string };
	found: {
		title?: string;
		doi?: string;
		url?: string;
		year?: number;
		isRetracted?: boolean;
	} | null;
	structuredIssues?: Array<{
		code?: string;
		field: string;
		message: string;
		written?: string;
		found?: string;
	}>;
	likelyHallucinated?: boolean;
	verificationKind?: VerificationKind;
}

export interface ReferenceCheckReport {
	summary: {
		total: number;
		verified: number;
		partialMatch: number;
		unverified: number;
	};
	references: CheckedReference[];
	truncated: boolean;
	totalParsed: number;
}

export interface ReferenceCheckQuota {
	tier: "anonymous" | "free" | "pro";
	monthlyLimit: number | null;
	monthlyRemaining: number | null;
	dailyLimit: number | null;
	dailyRemaining: number | null;
}

export type ReferenceVerdict =
	| "found"
	| "doi-differs"
	| "partial"
	| "grey-literature"
	| "retracted"
	| "not-found"
	| "possibly-fabricated";

/**
 * Wording is deliberate: "not found" is not "fake". Real works that are not
 * indexed also fail to match, so every negative verdict asks for a check by
 * hand instead of declaring the reference fabricated.
 */
export const VERDICT_LABELS: Record<ReferenceVerdict, string> = {
	found: "Found",
	"doi-differs": "Found, but the DOI differs",
	partial: "Partial match",
	"grey-literature": "Not indexed (grey literature)",
	retracted: "Retracted",
	"not-found": "Not found, check by hand",
	"possibly-fabricated": "Possibly fabricated, check by hand",
};

export function classifyReference(ref: CheckedReference): ReferenceVerdict {
	if (
		ref.verificationKind === "retracted" ||
		ref.found?.isRetracted === true
	) {
		return "retracted";
	}
	if (
		ref.likelyHallucinated === true ||
		ref.verificationKind === "suspicious"
	) {
		return "possibly-fabricated";
	}
	if (ref.verificationKind === "grey-literature") return "grey-literature";
	if (ref.status === "partial-match") return "partial";
	if (ref.status === "unverified") return "not-found";
	const reviewCodes: readonly string[] = REVIEW_ISSUE_CODES;
	if (
		ref.structuredIssues?.some(
			(issue) =>
				issue.code !== undefined && reviewCodes.includes(issue.code)
		)
	) {
		return "doi-differs";
	}
	return "found";
}

export function countVerdicts(references: CheckedReference[]): {
	found: number;
	review: number;
	notFound: number;
} {
	const counts = { found: 0, review: 0, notFound: 0 };
	for (const ref of references) {
		const verdict = classifyReference(ref);
		if (verdict === "found") counts.found += 1;
		else if (verdict === "not-found" || verdict === "possibly-fabricated") {
			counts.notFound += 1;
		} else counts.review += 1;
	}
	return counts;
}

/** The entries under the References heading, or null when there are none. */
export function extractReferencesForCheck(
	content: string,
	heading: string
): string | null {
	const lines = content.split("\n");
	const headingIndex = findHeadingIndex(lines, heading.trim());
	if (headingIndex === -1) return null;
	const sectionEnd = findSectionEnd(lines, headingIndex);
	// Footnote definitions often sit at the very end of a note, inside the
	// last section; they are not references.
	const text = lines
		.slice(headingIndex + 1, sectionEnd)
		.filter((line) => !/^\s*\[\^[^\]]+\]:/.test(line))
		.join("\n")
		.trim();
	return text || null;
}

export function normalizeReferenceCheckResponse(json: unknown): {
	report: ReferenceCheckReport;
	quota: ReferenceCheckQuota | null;
} {
	const data = isRecord(json) && isRecord(json.data) ? json.data : null;
	const report = data && isRecord(data.report) ? data.report : null;
	if (
		!report ||
		!Array.isArray(report.references) ||
		!isRecord(report.summary)
	) {
		throw new Error("Unexpected reference check response");
	}
	return {
		report: report as unknown as ReferenceCheckReport,
		quota: isRecord(data?.quota)
			? (data?.quota as unknown as ReferenceCheckQuota)
			: null,
	};
}

/** What the result modal offers next to an error message. */
export type CheckFailureAction =
	| "add-token"
	| "replace-token"
	| "upgrade"
	| null;

export interface CheckFailure {
	action: CheckFailureAction;
	message: string;
}

/** Turn an error response from the checker into a message a user can act on. */
export function describeReferenceCheckFailure(
	status: number,
	body: string,
	hasToken: boolean
): CheckFailure {
	const error = parseErrorBody(body);
	const details = isRecord(error.details) ? error.details : {};
	const quota = isRecord(details.quota) ? details.quota : {};

	// The server serves an unrecognized token the anonymous limits rather
	// than a 401, so an anonymous limit with a token set means the token
	// was ignored.
	const hitAnonymousLimit =
		(status === 403 && error.code === "QUOTA_EXCEEDED") ||
		(status === 429 && quota.tier === "anonymous");
	if (hasToken && hitAnonymousLimit) {
		return {
			action: "replace-token",
			message:
				"CiteMe did not recognize the token in the plugin settings, so this check ran on the free limits and reached them. Create a new token in your CiteMe settings and paste it into the plugin settings.",
		};
	}
	if (status === 400 && error.code?.startsWith("VALIDATION")) {
		return {
			action: null,
			message:
				"There is nothing to check yet. Select at least one full reference, or put your references under the References heading.",
		};
	}
	if (status === 403 && error.code === "QUOTA_EXCEEDED") {
		return {
			action: "add-token",
			message: `Without a CiteMe account, a check covers up to ${ANONYMOUS_REFERENCES_PER_CHECK} references. Select up to ${ANONYMOUS_REFERENCES_PER_CHECK} and check the selection, or add a CiteMe token in the plugin settings to check the whole list.`,
		};
	}
	if (status === 429) {
		if (quota.tier === "anonymous") {
			return {
				action: "add-token",
				message:
					details.scope === "daily"
						? "This network has used today's free checks. Try again tomorrow, or add a CiteMe token in the plugin settings."
						: `This network has used its ${ANONYMOUS_CHECKS_PER_MONTH} free checks this month. Add a CiteMe token in the plugin settings to check with your account.`,
			};
		}
		if (quota.tier === "free") {
			return {
				action: "upgrade",
				message:
					"Your CiteMe plan has used this month's checks. CiteMe Pro checks without a monthly limit.",
			};
		}
	}
	if (status === 401) {
		return {
			action: "replace-token",
			message:
				"CiteMe did not accept the token in the plugin settings. Create a new token in your CiteMe settings.",
		};
	}
	if (status === 413) {
		return {
			action: null,
			message:
				"This list is too long to check at once. Select part of it and check the selection.",
		};
	}
	return {
		action: null,
		message: error.message ?? `CiteMe returned an error (${status}).`,
	};
}

function parseErrorBody(body: string): {
	code?: string;
	message?: string;
	details?: unknown;
} {
	try {
		const json: unknown = JSON.parse(body);
		const error =
			isRecord(json) && isRecord(json.error) ? json.error : null;
		if (!error) return {};
		return {
			code: typeof error.code === "string" ? error.code : undefined,
			message:
				typeof error.message === "string" && error.message.trim()
					? error.message.trim()
					: undefined,
			details: error.details,
		};
	} catch {
		return {};
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
