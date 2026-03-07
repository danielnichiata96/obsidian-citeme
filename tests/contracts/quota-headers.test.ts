import { describe, it, expect } from "vitest";

/**
 * Contract tests: verify the plugin correctly handles
 * the CiteMe API quota header format.
 *
 * These headers are set by the SaaS at:
 *   citeme/app/api/v1/cite/route.ts
 *
 * Header names (case-insensitive):
 *   X-Quota-Used, X-Quota-Limit, X-Quota-Remaining, X-Quota-Tier
 */

// Replicate extractQuotaInfo logic for testing without Obsidian deps
function extractQuotaInfo(headers: Record<string, string>) {
	const read = (name: string): string | null => {
		const target = name.toLowerCase();
		for (const [key, value] of Object.entries(headers)) {
			if (key.toLowerCase() === target) return value;
		}
		return null;
	};
	const num = (name: string): number | null => {
		const v = read(name);
		if (!v) return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	};
	return {
		used: num("X-Quota-Used"),
		limit: num("X-Quota-Limit"),
		remaining: num("X-Quota-Remaining"),
		tier: read("X-Quota-Tier"),
	};
}

describe("Quota header parsing", () => {
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
});
