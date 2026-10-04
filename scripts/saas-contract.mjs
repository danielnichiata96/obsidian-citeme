/**
 * Reads the parts of the CiteMe web app this plugin depends on, straight from
 * its source. Shared by `scripts/sync-saas-contract.mjs` (writes the snapshot)
 * and `tests/contracts/*` (compare the plugin with the live source, or with
 * the snapshot when the sibling `../citeme` repo is absent, as in CI).
 *
 * v1.0.0 read `formatted.bibliography` and `formatted.inTextNarrative`, which
 * the API never returned, and parsed `X-Quota-*` headers that GET /cite never
 * sends. Every field the plugin reads is now pinned here.
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export function saasPaths(saasRoot) {
	return {
		styleLoader: resolve(saasRoot, "lib/citations/parser/style-loader.ts"),
		citationTypes: resolve(saasRoot, "types/citation.ts"),
		anonymousCiteQuota: resolve(saasRoot, "lib/quota/cite-anonymous.ts"),
		referenceCheckTypes: resolve(saasRoot, "types/reference-check.ts"),
		referenceCheckClassification: resolve(
			saasRoot,
			"lib/reference-check/entry-classification.ts"
		),
		referenceCheckLimits: resolve(saasRoot, "lib/reference-check/limits.ts"),
		referenceCheckMonthlyLimits: resolve(
			saasRoot,
			"lib/product/reference-check-limits.ts"
		),
	};
}

export function hasSaasSource(saasRoot) {
	return Object.values(saasPaths(saasRoot)).every((path) => existsSync(path));
}

export function readSaasContract(saasRoot) {
	const paths = saasPaths(saasRoot);
	return {
		styles: extractCuratedStyles(readFileSync(paths.styleLoader, "utf8")),
		formattedFields: extractInterfaceFields(
			readFileSync(paths.citationTypes, "utf8"),
			"ApiFormattedCitation"
		),
		anonymousDailyHeaders: extractDailyHeaders(
			readFileSync(paths.anonymousCiteQuota, "utf8")
		),
		referenceCheck: readReferenceCheckContract(paths),
	};
}

/**
 * Curated styles = STYLES entries with a CSL file (bibtex/ris have `file: ''`),
 * which is how the web app derives CURATED_STYLE_IDS. Returns slug → name,
 * with keys sorted for a stable snapshot.
 */
function extractCuratedStyles(source) {
	const entry =
		/^\s*'([a-z0-9-]+)':\s*\{\s*\n\s*name:\s*(['"])(.*?)\2,\s*\n\s*file:\s*(['"])(.*?)\4/gm;
	const styles = {};
	for (const match of source.matchAll(entry)) {
		const [, slug, , name, , file] = match;
		if (file !== "") styles[slug] = name;
	}
	if (Object.keys(styles).length === 0) {
		throw new Error("Could not read STYLES from style-loader.ts");
	}
	return Object.fromEntries(
		Object.keys(styles)
			.sort()
			.map((slug) => [slug, styles[slug]])
	);
}

/** Required (non-optional) field names of an exported interface, sorted. */
function extractInterfaceFields(source, name) {
	const block = source.match(
		new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`)
	);
	if (!block) {
		throw new Error(`Could not find interface ${name} in SaaS source`);
	}
	return [...block[1].matchAll(/^\s*([A-Za-z_]\w*):/gm)]
		.map((match) => match[1])
		.sort();
}

/**
 * What "Check references in this note" depends on: the status and
 * verification-kind values the report uses, the issue codes that demote a
 * matched reference to "needs review", and the anonymous limits the plugin
 * explains to the user.
 */
function readReferenceCheckContract(paths) {
	const types = readFileSync(paths.referenceCheckTypes, "utf8");
	return {
		statuses: extractStringUnion(types, "ReferenceStatus"),
		verificationKinds: extractStringUnion(types, "ReferenceVerificationKind"),
		reviewIssueCodes: extractStringSet(
			readFileSync(paths.referenceCheckClassification, "utf8"),
			"REVIEW_TRIGGERING_ISSUE_CODES"
		),
		anonymousReferencesPerCheck: extractNumberConstant(
			readFileSync(paths.referenceCheckLimits, "utf8"),
			"ANON_REF_CHECK_LIMIT"
		),
		anonymousChecksPerMonth: extractNumberConstant(
			readFileSync(paths.referenceCheckMonthlyLimits, "utf8"),
			"ANONYMOUS_MONTHLY_REFERENCE_CHECK_LIMIT"
		),
	};
}

/** Members of `export type Name = 'a' | 'b';`, sorted. */
function extractStringUnion(source, name) {
	const block = source.match(
		new RegExp(`export type ${name} =([\\s\\S]*?);`)
	);
	if (!block) throw new Error(`Could not find type ${name} in SaaS source`);
	return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

/** Members of `const NAME ... = new Set([...])`, sorted. */
function extractStringSet(source, name) {
	const block = source.match(
		new RegExp(`const ${name}[^=]*= new Set\\(\\[([^\\]]*)\\]`)
	);
	if (!block) throw new Error(`Could not find set ${name} in SaaS source`);
	return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

function extractNumberConstant(source, name) {
	const match = source.match(
		new RegExp(`export const ${name}\\s*=\\s*(\\d+)`)
	);
	if (!match) throw new Error(`Could not find constant ${name} in SaaS source`);
	return Number(match[1]);
}

function extractDailyHeaders(source) {
	const headers = [
		...new Set(source.match(/X-RateLimit-Daily-[A-Za-z]+/g) ?? []),
	].sort();
	if (headers.length === 0) {
		throw new Error("Could not find X-RateLimit-Daily-* headers in SaaS source");
	}
	return headers;
}
