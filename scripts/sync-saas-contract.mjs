import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const repoRoot = process.cwd();
const saasRoot = resolve(repoRoot, "../citeme");
const styleLoaderPath = resolve(
	saasRoot,
	"lib/citations/parser/style-loader.ts"
);
const planConfigPath = resolve(saasRoot, "lib/plans/config.ts");
const quotaMiddlewarePath = resolve(
	saasRoot,
	"lib/quota/middleware.ts"
);
const snapshotPath = resolve(
	repoRoot,
	"tests/contracts/saas-contract.snapshot.json"
);

if (
	!existsSync(styleLoaderPath) ||
	!existsSync(planConfigPath) ||
	!existsSync(quotaMiddlewarePath)
) {
	console.error("Live SaaS repo not found at ../citeme");
	process.exit(1);
}

const snapshot = {
	styleSlugs: extractStyleSlugs(readFileSync(styleLoaderPath, "utf8")),
	freeStyles: extractArrayConst(
		readFileSync(planConfigPath, "utf8"),
		"FREE_STYLES"
	),
	quotaHeaders: extractQuotaHeaders(
		readFileSync(quotaMiddlewarePath, "utf8")
	),
};

writeFileSync(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
console.log(`Updated ${snapshotPath}`);

function extractStyleSlugs(source) {
	return [...source.matchAll(/^\s*'([a-z0-9-]+)':\s*{/gm)]
		.map((match) => match[1])
		.filter((slug) => !["bibtex", "ris"].includes(slug))
		.sort();
}

function extractArrayConst(source, constName) {
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

function extractQuotaHeaders(source) {
	return [...new Set(source.match(/X-Quota-(Used|Limit|Remaining|Tier)/g) ?? [])]
		.sort();
}
