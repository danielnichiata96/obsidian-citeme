import { CITATION_STYLES } from "./constants";

export interface QuotaInfo {
	used: number | null;
	limit: number | null;
	remaining: number | null;
	tier: string | null;
	/**
	 * `day` = the anonymous rolling 24h budget GET /cite reports;
	 * `month` = a signed-in plan quota; `null` = unknown yet.
	 */
	window: "day" | "month" | null;
}

export function normalizeTier(tier?: string | null): string {
	const value = tier?.trim().toLowerCase();
	return value || "anonymous";
}

/**
 * Dropdown options for every curated style. The API formats all of them for
 * anonymous callers, so none is locked here.
 */
export function getCitationStyleOptions(): Array<[string, string]> {
	return Object.keys(CITATION_STYLES).map((style) => [
		style,
		CITATION_STYLES[style],
	]);
}

export function getUsedQuota(quota?: QuotaInfo | null): number | null {
	if (!quota) {
		return null;
	}

	if (quota.used !== null) {
		return quota.used;
	}

	if (quota.limit !== null && quota.remaining !== null) {
		return Math.max(quota.limit - quota.remaining, 0);
	}

	return null;
}

export function formatQuotaLabel(quota?: QuotaInfo | null): string {
	const tier = normalizeTier(quota?.tier);
	const used = getUsedQuota(quota);
	const limit = quota?.limit ?? null;

	if (tier === "pro") {
		return "CiteMe: Pro";
	}

	if (used !== null && limit !== null) {
		return quota?.window === "day"
			? `CiteMe: ${used}/${limit} searches (24h)`
			: `CiteMe: ${used}/${limit} citations this month`;
	}

	if (quota?.remaining === 0) {
		return "CiteMe: Limit reached";
	}

	if (tier === "free") {
		return "CiteMe: Free";
	}

	return "CiteMe: Anonymous";
}

export function formatAccessSummary(quota?: QuotaInfo | null): string {
	const styles = `All ${Object.keys(CITATION_STYLES).length} citation styles are available.`;
	const used = getUsedQuota(quota);
	const limit = quota?.limit ?? null;

	if (used !== null && limit !== null) {
		return quota?.window === "day"
			? `No account needed. ${used}/${limit} searches in the last 24 hours on this network. ${styles}`
			: `${used}/${limit} citations this month. ${styles}`;
	}

	return `No account needed. ${styles}`;
}
