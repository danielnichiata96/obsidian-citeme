import { describe, it, expect } from "vitest";
import {
	DAILY_QUOTA_HEADERS,
	extractQuotaInfo,
	parseNumberHeader,
} from "../../src/utils/headers";
import {
	hasLiveSaasContract,
	loadLiveSaasContract,
	loadSaasContract,
	loadSnapshotSaasContract,
} from "./saas-contract-source";

/**
 * SaaS parity tests for quota headers.
 *
 * Live SaaS source is used when the sibling repo exists; otherwise the
 * checked-in snapshot is used.
 */

const saasContract = loadSaasContract();

describe("Quota header parsing", () => {
	if (hasLiveSaasContract()) {
		it("checked-in snapshot matches the live SaaS contract", () => {
			expect(loadSnapshotSaasContract()).toEqual(loadLiveSaasContract());
		});
	}

	it("reads the daily headers GET /api/v1/cite sends to anonymous callers", () => {
		// v1.0.0 parsed only X-Quota-*, which GET /cite never sends, so the
		// status bar was stuck on "CiteMe: Anonymous".
		for (const header of Object.values(DAILY_QUOTA_HEADERS)) {
			expect(saasContract.anonymousDailyHeaders).toContain(header);
		}
	});

	it("parses the anonymous daily budget", () => {
		const quota = extractQuotaInfo({
			"x-ratelimit-daily-limit": "500",
			"x-ratelimit-daily-remaining": "494",
			"x-ratelimit-daily-reset": "46428",
		});
		expect(quota).toEqual({
			used: 6,
			limit: 500,
			remaining: 494,
			tier: "anonymous",
			window: "day",
		});
	});

	it("parses standard quota headers", () => {
		const headers = {
			"X-Quota-Used": "5",
			"X-Quota-Limit": "20",
			"X-Quota-Remaining": "15",
			"X-Quota-Tier": "free",
		};
		const quota = extractQuotaInfo(headers);
		expect(quota).toEqual({
			used: 5,
			limit: 20,
			remaining: 15,
			tier: "free",
			window: "month",
		});
	});

	it("handles case-insensitive header names", () => {
		const headers = {
			"x-quota-used": "10",
			"x-quota-limit": "20",
			"x-quota-remaining": "10",
			"x-quota-tier": "Pro",
		};
		const quota = extractQuotaInfo(headers);
		expect(quota.used).toBe(10);
		expect(quota.tier).toBe("Pro");
	});

	it("returns null for missing headers", () => {
		const quota = extractQuotaInfo({});
		expect(quota).toEqual({
			used: null,
			limit: null,
			remaining: null,
			tier: null,
			window: null,
		});
	});

	it("handles non-numeric values gracefully", () => {
		const headers = {
			"X-Quota-Used": "abc",
			"X-Quota-Limit": "",
			"X-Quota-Tier": "free",
		};
		const quota = extractQuotaInfo(headers);
		expect(quota.used).toBeNull();
		expect(quota.limit).toBeNull();
		expect(quota.tier).toBe("free");
	});

	it("handles pro tier with no quota limits", () => {
		const headers = {
			"X-Quota-Tier": "pro",
		};
		const quota = extractQuotaInfo(headers);
		expect(quota.tier).toBe("pro");
		expect(quota.used).toBeNull();
		expect(quota.limit).toBeNull();
	});

	it("parses '0' as numeric zero, not null", () => {
		const headers = {
			"X-Quota-Used": "0",
			"X-Quota-Remaining": "0",
		};
		const quota = extractQuotaInfo(headers);
		expect(quota.used).toBe(0);
		expect(quota.remaining).toBe(0);
	});

	it("parseNumberHeader returns 0 for '0' header value", () => {
		expect(parseNumberHeader({ "X-Val": "0" }, "X-Val")).toBe(0);
	});
});
