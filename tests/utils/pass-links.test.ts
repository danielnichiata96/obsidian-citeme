import { describe, expect, it } from "vitest";
import {
	CITEME_PASS_LINK_MONTHLY_LIMIT,
	CITEME_PASS_LINK_TRUNCATED,
} from "../../src/utils/constants";
import manifest from "../../manifest.json";

describe("links to the Thesis Pass", () => {
	const links = {
		check_monthly_limit: CITEME_PASS_LINK_MONTHLY_LIMIT,
		check_truncated: CITEME_PASS_LINK_TRUNCATED,
	};

	it.each(Object.entries(links))(
		"%s lands on the Pass card with its own campaign",
		(campaign, link) => {
			const url = new URL(link);
			expect(url.origin + url.pathname).toBe("https://citeme.app/pricing");
			expect(url.searchParams.get("utm_source")).toBe("obsidian");
			expect(url.searchParams.get("utm_medium")).toBe("plugin");
			expect(url.searchParams.get("utm_campaign")).toBe(campaign);
			expect(url.hash).toBe("#thesis-pass");
		}
	);
});

describe("manifest fundingUrl", () => {
	it("carries UTM, because Obsidian opens it without a referrer", () => {
		const url = new URL(manifest.fundingUrl);
		expect(url.hostname).toBe("citeme.app");
		expect(url.searchParams.get("utm_source")).toBe("obsidian");
		expect(url.searchParams.get("utm_campaign")).toBe("funding");
	});
});
