import { readFileSync, writeFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const targetVersion = process.argv[2] ?? pkg.version;
const isNpmVersionLifecycle = process.env.npm_lifecycle_event === "version";

if (!targetVersion) {
	console.error("Usage: node scripts/version-bump.mjs <version>");
	process.exit(1);
}

if (!process.argv[2] && !isNpmVersionLifecycle) {
	console.error("Usage: node scripts/version-bump.mjs <version>");
	process.exit(1);
}

// Validate semver format
if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
	console.error(`Invalid version format: ${targetVersion}`);
	process.exit(1);
}

// Update package.json
pkg.version = targetVersion;
writeFileSync("package.json", JSON.stringify(pkg, null, "\t") + "\n");

// Update manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const minAppVersion = manifest.minAppVersion;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

// Update versions.json
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");

console.log(`Bumped to ${targetVersion} (minApp: ${minAppVersion})`);
