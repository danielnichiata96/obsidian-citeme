import { writeFileSync } from "fs";
import { resolve } from "path";
import { hasSaasSource, readSaasContract } from "./saas-contract.mjs";

const repoRoot = process.cwd();
const saasRoot = resolve(repoRoot, "../citeme");
const snapshotPath = resolve(
	repoRoot,
	"tests/contracts/saas-contract.snapshot.json"
);

if (!hasSaasSource(saasRoot)) {
	console.error("Live SaaS repo not found at ../citeme");
	process.exit(1);
}

const snapshot = readSaasContract(saasRoot);
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, "\t") + "\n");
console.log(`Updated ${snapshotPath}`);
