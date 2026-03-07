import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { resolve, join } from "path";
import { execFileSync } from "child_process";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT_PATH = resolve(process.cwd(), "scripts/version-bump.mjs");
const FIXTURE_FILES = ["package.json", "manifest.json", "versions.json"];
const tempDirs: string[] = [];

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("version-bump script", () => {
	it("bumps package, manifest and versions when called manually", () => {
		const dir = createTempProject();

		execFileSync("node", [SCRIPT_PATH, "1.0.1"], { cwd: dir });

		const pkg = readJson(join(dir, "package.json"));
		const manifest = readJson(join(dir, "manifest.json"));
		const versions = readJson(join(dir, "versions.json"));

		expect(pkg.version).toBe("1.0.1");
		expect(manifest.version).toBe("1.0.1");
		expect(versions["1.0.1"]).toBe(manifest.minAppVersion);
	});

	it("works as npm version lifecycle script without argv version", () => {
		const dir = createTempProject();
		const pkgPath = join(dir, "package.json");
		const pkg = readJson(pkgPath);
		pkg.version = "1.0.2";
		writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t") + "\n");

		execFileSync("node", [SCRIPT_PATH], {
			cwd: dir,
			env: {
				...process.env,
				npm_lifecycle_event: "version",
			},
		});

		const manifest = readJson(join(dir, "manifest.json"));
		const versions = readJson(join(dir, "versions.json"));

		expect(manifest.version).toBe("1.0.2");
		expect(versions["1.0.2"]).toBe(manifest.minAppVersion);
	});
});

function createTempProject(): string {
	const dir = mkdtempSync(join(tmpdir(), "citeme-version-bump-"));
	tempDirs.push(dir);

	mkdirSync(resolve(dir), { recursive: true });
	for (const file of FIXTURE_FILES) {
		copyFileSync(resolve(process.cwd(), file), join(dir, file));
	}

	return dir;
}

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, "utf8")) as T;
}
