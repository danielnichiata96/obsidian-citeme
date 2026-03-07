import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export interface SaasContractSnapshot {
	styleSlugs: string[];
	freeStyles: string[];
	quotaHeaders: string[];
}

const LIVE_SAAS_ROOT = resolve(process.cwd(), "../citeme");
const STYLE_LOADER_PATH = resolve(
	LIVE_SAAS_ROOT,
	"lib/citations/parser/style-loader.ts"
);
const PLAN_CONFIG_PATH = resolve(
	LIVE_SAAS_ROOT,
	"lib/plans/config.ts"
);
const QUOTA_MIDDLEWARE_PATH = resolve(
	LIVE_SAAS_ROOT,
	"lib/quota/middleware.ts"
);
const SNAPSHOT_PATH = resolve(
	process.cwd(),
	"tests/contracts/saas-contract.snapshot.json"
);

export function hasLiveSaasContract(): boolean {
	return (
		existsSync(STYLE_LOADER_PATH) &&
		existsSync(PLAN_CONFIG_PATH) &&
		existsSync(QUOTA_MIDDLEWARE_PATH)
	);
}

export function loadSaasContract(): SaasContractSnapshot {
	return hasLiveSaasContract()
		? loadLiveSaasContract()
		: loadSnapshotSaasContract();
}

export function loadLiveSaasContract(): SaasContractSnapshot {
	return {
		styleSlugs: extractStyleSlugs(
			readFileSync(STYLE_LOADER_PATH, "utf8")
		),
		freeStyles: extractArrayConst(
			readFileSync(PLAN_CONFIG_PATH, "utf8"),
			"FREE_STYLES"
		),
		quotaHeaders: extractQuotaHeaders(
			readFileSync(QUOTA_MIDDLEWARE_PATH, "utf8")
		),
	};
}

export function loadSnapshotSaasContract(): SaasContractSnapshot {
	return JSON.parse(
		readFileSync(SNAPSHOT_PATH, "utf8")
	) as SaasContractSnapshot;
}

function extractStyleSlugs(source: string): string[] {
	const matches = [
		...source.matchAll(/^\s*'([a-z0-9-]+)':\s*{/gm),
	];
	return matches
		.map((match) => match[1])
		.filter((slug) => !["bibtex", "ris"].includes(slug))
		.sort();
}

function extractArrayConst(source: string, constName: string): string[] {
	const match = source.match(
		new RegExp(
			`export const ${constName} = \\[([\\s\\S]*?)\\] as const`
		)
	);
	if (!match) {
		throw new Error(`Could not find ${constName} in SaaS source`);
	}

	return [...match[1].matchAll(/"([^"]+)"|'([^']+)'/g)]
		.map((value) => value[1] || value[2])
		.sort();
}

function extractQuotaHeaders(source: string): string[] {
	return [...new Set(source.match(/X-Quota-(Used|Limit|Remaining|Tier)/g) ?? [])]
		.sort();
}
