import { readFileSync } from "fs";
import { resolve } from "path";
import { hasSaasSource, readSaasContract } from "../../scripts/saas-contract.mjs";

export interface SaasContractSnapshot {
	/** Curated style slug → display name. */
	styles: Record<string, string>;
	/** Required fields of each result's `formatted` object. */
	formattedFields: string[];
	/** Rate-limit headers GET /api/v1/cite sends to anonymous callers. */
	anonymousDailyHeaders: string[];
}

const LIVE_SAAS_ROOT = resolve(process.cwd(), "../citeme");
const SNAPSHOT_PATH = resolve(
	process.cwd(),
	"tests/contracts/saas-contract.snapshot.json"
);

export function hasLiveSaasContract(): boolean {
	return hasSaasSource(LIVE_SAAS_ROOT);
}

export function loadSaasContract(): SaasContractSnapshot {
	return hasLiveSaasContract()
		? loadLiveSaasContract()
		: loadSnapshotSaasContract();
}

export function loadLiveSaasContract(): SaasContractSnapshot {
	return readSaasContract(LIVE_SAAS_ROOT) as SaasContractSnapshot;
}

export function loadSnapshotSaasContract(): SaasContractSnapshot {
	return JSON.parse(
		readFileSync(SNAPSHOT_PATH, "utf8")
	) as SaasContractSnapshot;
}
