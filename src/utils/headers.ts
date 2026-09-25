import type { QuotaInfo } from "./access";

/**
 * GET /api/v1/cite sends these to anonymous callers — the rolling 24h budget
 * the web app shares across cite transports. Pinned to the web app's
 * lib/quota/cite-anonymous.ts by tests/contracts/quota-headers.test.ts.
 */
export const DAILY_QUOTA_HEADERS = {
	limit: "X-RateLimit-Daily-Limit",
	remaining: "X-RateLimit-Daily-Remaining",
} as const;

/**
 * Signed-in plan quota (monthly). Only authenticated requests get these; the
 * plugin reads them if present but currently sends no credentials.
 */
const MONTHLY_QUOTA_HEADERS = {
	used: "X-Quota-Used",
	limit: "X-Quota-Limit",
	remaining: "X-Quota-Remaining",
	tier: "X-Quota-Tier",
} as const;

export function extractQuotaInfo(headers: Record<string, string>): QuotaInfo {
	const monthly = {
		used: parseNumberHeader(headers, MONTHLY_QUOTA_HEADERS.used),
		limit: parseNumberHeader(headers, MONTHLY_QUOTA_HEADERS.limit),
		remaining: parseNumberHeader(headers, MONTHLY_QUOTA_HEADERS.remaining),
		tier: readHeader(headers, MONTHLY_QUOTA_HEADERS.tier),
	};
	if (
		monthly.used !== null ||
		monthly.limit !== null ||
		monthly.remaining !== null ||
		monthly.tier !== null
	) {
		return { ...monthly, window: "month" };
	}

	const limit = parseNumberHeader(headers, DAILY_QUOTA_HEADERS.limit);
	const remaining = parseNumberHeader(headers, DAILY_QUOTA_HEADERS.remaining);
	if (limit !== null || remaining !== null) {
		return {
			used:
				limit !== null && remaining !== null
					? Math.max(limit - remaining, 0)
					: null,
			limit,
			remaining,
			tier: "anonymous",
			window: "day",
		};
	}

	return {
		used: null,
		limit: null,
		remaining: null,
		tier: null,
		window: null,
	};
}

export function parseNumberHeader(
	headers: Record<string, string>,
	name: string
): number | null {
	const value = readHeader(headers, name);
	if (value === null || value === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function readHeader(
	headers: Record<string, string>,
	name: string
): string | null {
	const target = name.toLowerCase();

	for (const key of Object.keys(headers)) {
		if (key.toLowerCase() === target) {
			return headers[key];
		}
	}

	return null;
}
