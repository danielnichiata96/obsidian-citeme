import { CITATION_STYLES, FREE_TIER_STYLES } from "./constants";

export interface QuotaInfo {
	used: number | null;
	limit: number | null;
	remaining: number | null;
	tier: string | null;
}

export function normalizeTier(tier?: string | null): string {
	const value = tier?.trim().toLowerCase();
	return value || "anonymous";
}

export function canUseStyle(style: string, tier?: string | null): boolean {
	if (!style) {
		return true;
	}

	return normalizeTier(tier) === "pro"
		? true
		: (FREE_TIER_STYLES as readonly string[]).includes(style);
}

export function isProStyle(style: string): boolean {
	return !(FREE_TIER_STYLES as readonly string[]).includes(style);
}

export function getCitationStyleLabel(
	style: string,
	tier?: string | null
): string {
	const label = CITATION_STYLES[style] || style;
	return canUseStyle(style, tier) ? label : `${label} (Pro)`;
}

export function getCitationStyleOptions(
	tier?: string | null
): Array<[string, string]> {
	return Object.keys(CITATION_STYLES).map((style) => [
		style,
		getCitationStyleLabel(style, tier),
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
		return `CiteMe: ${used}/${limit} citations`;
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
	const tier = normalizeTier(quota?.tier);
	const used = getUsedQuota(quota);
	const limit = quota?.limit ?? null;

	if (tier === "pro") {
		return "CiteMe Pro unlocked. All citation styles are available.";
	}

	if (used !== null && limit !== null) {
		return `Tier: ${capitalizeTier(tier)}. Usage: ${used}/${limit} citations this month.`;
	}

	if (tier === "free") {
		return "Tier: Free. 10 citation styles are currently available.";
	}

	return "Tier: Anonymous. 20 citations/month and 10 citation styles are available.";
}

function capitalizeTier(tier: string): string {
	if (!tier) {
		return "Anonymous";
	}

	return tier.charAt(0).toUpperCase() + tier.slice(1);
}
