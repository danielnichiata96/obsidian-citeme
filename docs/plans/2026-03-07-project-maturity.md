# Project Maturity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring obsidian-citeme to mature open-source standards before publishing to Obsidian Community Plugins — CI, tests, changelog, lint, contract tests, screenshots, auth flow, and settings guideline fix.

**Architecture:** Five priority layers — (1) CI with build+lint+smoke, (2) contract tests for style/quota parity with SaaS, (3) changelog+screenshots+demo, (4) auth/API key flow in settings, (5) settings tab guideline alignment. Each layer builds independently.

**Tech Stack:** GitHub Actions, Vitest (lightweight, ESM-native, zero-config for TS), ESLint + Prettier, TypeScript 4.7, esbuild, Obsidian Plugin API

---

## Task 1: Add ESLint + Prettier

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Modify: `package.json` (add devDeps + scripts)

**Step 1: Install ESLint + Prettier**

Run:
```bash
cd "/Volumes/SSD EXTERNO/Projetos de Codigo/obisidian-citeme"
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

**Step 2: Create ESLint config**

Create `.eslintrc.cjs`:
```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
  },
  env: {
    browser: true,
    node: true,
  },
};
```

**Step 3: Create Prettier config**

Create `.prettierrc`:
```json
{
  "useTabs": true,
  "tabWidth": 4,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5"
}
```

Note: matches existing code style (tabs, double quotes, trailing commas).

**Step 4: Add lint scripts to package.json**

Add to `scripts`:
```json
"lint": "eslint . --ext .ts --ignore-path .gitignore",
"lint:fix": "eslint . --ext .ts --ignore-path .gitignore --fix",
"format": "prettier --write 'src/**/*.ts' 'main.ts'",
"format:check": "prettier --check 'src/**/*.ts' 'main.ts'"
```

**Step 5: Run lint and fix any issues**

Run: `npm run lint`
Expected: May have minor warnings. Fix any errors.

Run: `npm run format:check`
Expected: Check if files match format.

**Step 6: Commit**

```bash
git add .eslintrc.cjs .prettierrc package.json package-lock.json
git commit -m "chore: add ESLint + Prettier configuration"
```

---

## Task 2: Add Vitest and first unit tests for access.ts

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/utils/access.test.ts`
- Modify: `package.json` (add vitest devDep + test script)
- Modify: `tsconfig.json` (add `exclude: ["node_modules", "tests"]` so tests don't get bundled)

**Step 1: Install Vitest**

Run:
```bash
npm install --save-dev vitest
```

**Step 2: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

**Step 3: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Add exclude to tsconfig.json**

Add `"exclude": ["node_modules", "tests"]` to `tsconfig.json` so test files don't interfere with the production build.

**Step 5: Write the failing test for access.ts**

Create `tests/utils/access.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  normalizeTier,
  canUseStyle,
  isProStyle,
  getCitationStyleLabel,
  getUsedQuota,
  formatQuotaLabel,
  formatAccessSummary,
} from "../../src/utils/access";

describe("normalizeTier", () => {
  it("returns 'anonymous' for null/undefined", () => {
    expect(normalizeTier(null)).toBe("anonymous");
    expect(normalizeTier(undefined)).toBe("anonymous");
    expect(normalizeTier("")).toBe("anonymous");
  });

  it("normalizes to lowercase trimmed", () => {
    expect(normalizeTier("Pro")).toBe("pro");
    expect(normalizeTier("  Free  ")).toBe("free");
  });
});

describe("canUseStyle", () => {
  it("allows any style for pro tier", () => {
    expect(canUseStyle("nature", "pro")).toBe(true);
    expect(canUseStyle("apa", "pro")).toBe(true);
  });

  it("allows free styles for anonymous", () => {
    expect(canUseStyle("apa", null)).toBe(true);
    expect(canUseStyle("mla", "free")).toBe(true);
  });

  it("blocks pro styles for non-pro tiers", () => {
    expect(canUseStyle("nature", null)).toBe(false);
    expect(canUseStyle("nature", "free")).toBe(false);
  });

  it("returns true for empty style", () => {
    expect(canUseStyle("", null)).toBe(true);
  });
});

describe("isProStyle", () => {
  it("returns false for free styles", () => {
    expect(isProStyle("apa")).toBe(false);
    expect(isProStyle("ieee")).toBe(false);
    expect(isProStyle("abnt")).toBe(false);
  });

  it("returns true for pro styles", () => {
    expect(isProStyle("nature")).toBe(true);
    expect(isProStyle("cell")).toBe(true);
    expect(isProStyle("lancet")).toBe(true);
  });
});

describe("getCitationStyleLabel", () => {
  it("returns label without suffix for accessible style", () => {
    expect(getCitationStyleLabel("apa", "free")).toBe("APA (7th edition)");
  });

  it("appends (Pro) for inaccessible style", () => {
    expect(getCitationStyleLabel("nature", "free")).toBe("Nature (Pro)");
  });

  it("returns plain label for pro tier", () => {
    expect(getCitationStyleLabel("nature", "pro")).toBe("Nature");
  });
});

describe("getUsedQuota", () => {
  it("returns null for null/undefined quota", () => {
    expect(getUsedQuota(null)).toBeNull();
    expect(getUsedQuota(undefined)).toBeNull();
  });

  it("returns used when present", () => {
    expect(
      getUsedQuota({ used: 5, limit: 20, remaining: 15, tier: "free" })
    ).toBe(5);
  });

  it("computes used from limit - remaining", () => {
    expect(
      getUsedQuota({ used: null, limit: 20, remaining: 15, tier: "free" })
    ).toBe(5);
  });

  it("returns null when insufficient data", () => {
    expect(
      getUsedQuota({ used: null, limit: null, remaining: null, tier: null })
    ).toBeNull();
  });
});

describe("formatQuotaLabel", () => {
  it("returns Pro label for pro tier", () => {
    expect(
      formatQuotaLabel({ used: 100, limit: null, remaining: null, tier: "pro" })
    ).toBe("CiteMe: Pro");
  });

  it("returns usage label when data available", () => {
    expect(
      formatQuotaLabel({ used: 5, limit: 20, remaining: 15, tier: "free" })
    ).toBe("CiteMe: 5/20 citations");
  });

  it("returns limit reached when remaining is 0", () => {
    expect(
      formatQuotaLabel({ used: null, limit: null, remaining: 0, tier: null })
    ).toBe("CiteMe: Limit reached");
  });

  it("returns Free for free tier without usage data", () => {
    expect(
      formatQuotaLabel({
        used: null,
        limit: null,
        remaining: null,
        tier: "free",
      })
    ).toBe("CiteMe: Free");
  });

  it("returns Anonymous for unknown tier", () => {
    expect(formatQuotaLabel(null)).toBe("CiteMe: Anonymous");
  });
});

describe("formatAccessSummary", () => {
  it("returns pro message for pro tier", () => {
    expect(
      formatAccessSummary({
        used: null,
        limit: null,
        remaining: null,
        tier: "pro",
      })
    ).toContain("Pro unlocked");
  });

  it("returns anonymous message for null", () => {
    expect(formatAccessSummary(null)).toContain("Anonymous");
  });
});
```

**Step 6: Run test to verify it passes**

Run: `npx vitest run tests/utils/access.test.ts`
Expected: All tests PASS (these test existing working code).

**Step 7: Commit**

```bash
git add vitest.config.ts tests/ package.json package-lock.json tsconfig.json
git commit -m "test: add Vitest and unit tests for access utilities"
```

---

## Task 3: Unit tests for formatter.ts

**Files:**
- Create: `tests/utils/formatter.test.ts`

**Step 1: Write tests for formatter utilities**

Create `tests/utils/formatter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { findHeadingIndex, findSectionEnd } from "../../src/utils/formatter";

describe("findHeadingIndex", () => {
  it("finds heading at correct line", () => {
    const lines = ["# Title", "", "## References", "entry1"];
    expect(findHeadingIndex(lines, "## References")).toBe(2);
  });

  it("returns -1 when heading not found", () => {
    const lines = ["# Title", "", "Some text"];
    expect(findHeadingIndex(lines, "## References")).toBe(-1);
  });

  it("matches case-insensitively", () => {
    const lines = ["## references"];
    expect(findHeadingIndex(lines, "## References")).toBe(0);
  });

  it("matches by heading level", () => {
    const lines = ["### References"];
    expect(findHeadingIndex(lines, "## References")).toBe(-1);
  });
});

describe("findSectionEnd", () => {
  it("returns lines.length when no next heading", () => {
    const lines = ["## References", "entry"];
    expect(findSectionEnd(lines, 0)).toBe(2);
  });

  it("stops at same-level heading", () => {
    const lines = ["## References", "entry", "## Notes"];
    expect(findSectionEnd(lines, 0)).toBe(2);
  });

  it("stops at higher-level heading", () => {
    const lines = ["## References", "entry", "# Top"];
    expect(findSectionEnd(lines, 0)).toBe(2);
  });

  it("does not stop at lower-level heading", () => {
    const lines = ["## References", "entry", "### Sub", "more"];
    expect(findSectionEnd(lines, 0)).toBe(4);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/utils/formatter.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/utils/formatter.test.ts
git commit -m "test: add unit tests for formatter heading/section utilities"
```

---

## Task 4: Contract tests for style parity with SaaS

**Files:**
- Create: `tests/contracts/style-parity.test.ts`

**Step 1: Write contract test**

Create `tests/contracts/style-parity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { CITATION_STYLES, FREE_TIER_STYLES } from "../../src/utils/constants";

/**
 * Contract tests: ensure the plugin's style and tier constants
 * stay in sync with the CiteMe SaaS.
 *
 * Source of truth:
 *   - styles: citeme/lib/citations/parser/style-loader.ts
 *   - free styles: citeme/lib/plans/config.ts FREE_STYLES
 *
 * When the SaaS adds or removes styles, update these tests.
 */

const SAAS_STYLE_SLUGS = [
  "abnt", "abnt-numerico", "apa", "mla", "chicago-author-date",
  "chicago-note", "turabian", "ieee", "ama", "asa", "bluebook",
  "cse", "acs", "harvard", "vancouver", "oscola", "mhra", "bmj",
  "elsevier-harvard", "sage-harvard", "taylor-francis",
  "cambridge-university-press", "royal-society", "din-1505",
  "iso690-de", "iso690-fr", "iso690", "nature", "plos", "science",
  "cell", "lancet", "aip", "rsc", "apsa", "aaa", "np405",
  "iso690-es", "harvard-uct", "aglc", "harvard-agps",
  "vancouver-author-date", "mcgill",
];

const SAAS_FREE_STYLES = [
  "apa", "mla", "chicago-author-date", "vancouver", "harvard",
  "ieee", "chicago-note", "ama", "acs", "abnt",
];

describe("Style parity with SaaS", () => {
  it("plugin has exactly 43 citation styles", () => {
    expect(Object.keys(CITATION_STYLES)).toHaveLength(43);
  });

  it("plugin styles match SaaS style slugs exactly", () => {
    const pluginSlugs = Object.keys(CITATION_STYLES).sort();
    const saasSlugs = [...SAAS_STYLE_SLUGS].sort();
    expect(pluginSlugs).toEqual(saasSlugs);
  });

  it("plugin has exactly 10 free tier styles", () => {
    expect(FREE_TIER_STYLES).toHaveLength(10);
  });

  it("free tier styles match SaaS FREE_STYLES exactly", () => {
    const pluginFree = [...FREE_TIER_STYLES].sort();
    const saasFree = [...SAAS_FREE_STYLES].sort();
    expect(pluginFree).toEqual(saasFree);
  });

  it("all free styles exist in CITATION_STYLES", () => {
    for (const style of FREE_TIER_STYLES) {
      expect(CITATION_STYLES).toHaveProperty(style);
    }
  });

  it("every CITATION_STYLES key is a non-empty string slug", () => {
    for (const key of Object.keys(CITATION_STYLES)) {
      expect(key).toMatch(/^[a-z0-9-]+$/);
      expect(CITATION_STYLES[key].length).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/contracts/style-parity.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/contracts/style-parity.test.ts
git commit -m "test: add contract tests for SaaS style parity"
```

---

## Task 5: Contract tests for quota headers

**Files:**
- Create: `tests/contracts/quota-headers.test.ts`

**Step 1: Write quota header contract test**

Create `tests/contracts/quota-headers.test.ts`:
```ts
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
      used: 5, limit: 20, remaining: 15, tier: "free",
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
      used: null, limit: null, remaining: null, tier: null,
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
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/contracts/quota-headers.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/contracts/quota-headers.test.ts
git commit -m "test: add contract tests for quota header parsing"
```

---

## Task 6: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Type check
        run: npx tsc -noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - name: Smoke check - manifest.json
        run: |
          node -e "
            const m = require('./manifest.json');
            const v = require('./versions.json');
            const p = require('./package.json');
            const assert = require('assert');
            assert(m.id, 'manifest.id missing');
            assert(m.version, 'manifest.version missing');
            assert(m.minAppVersion, 'manifest.minAppVersion missing');
            assert.strictEqual(m.version, p.version, 'manifest.version != package.json version');
            assert(v[m.version], 'versions.json missing entry for ' + m.version);
            assert.strictEqual(v[m.version], m.minAppVersion, 'versions.json minAppVersion mismatch');
            console.log('Smoke check passed: v' + m.version + ' (minApp: ' + m.minAppVersion + ')');
          "

      - name: Smoke check - build artifacts
        run: |
          test -f main.js || (echo "main.js not found" && exit 1)
          test -f manifest.json || (echo "manifest.json not found" && exit 1)
          test -f styles.css || (echo "styles.css not found" && exit 1)
          echo "All release artifacts present"
```

**Step 2: Verify YAML is valid**

Run: `node -e "const yaml = require('yaml'); yaml.parse(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8')); console.log('Valid YAML');"` or install yaml dep temporarily. Alternatively, just verify by visual inspection — the YAML above uses standard GitHub Actions syntax.

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow with build, lint, test, and smoke checks"
```

---

## Task 7: Create CHANGELOG.md

**Files:**
- Create: `CHANGELOG.md`

**Step 1: Create initial changelog**

Create `CHANGELOG.md`:
```markdown
# Changelog

All notable changes to the CiteMe plugin for Obsidian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-07

### Added
- Search millions of academic papers from within Obsidian
- 43 citation styles (10 free, 33 Pro) synced with CiteMe SaaS
- Insert as bibliography, in-text, narrative, or both
- Automatic References section with duplicate detection (DOI + exact text)
- Alphabetical insertion in References section
- DOI lookup command for precise paper retrieval
- Status bar quota display with tier-aware labels
- Right-click context menu for selected text search
- Ribbon icon for quick search access
- Pro style gating with upgrade notices and links to citeme.app/pricing
- Quota exceeded notices with actionable links
- Mobile compatible
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG.md for v1.0.0"
```

---

## Task 8: Version bump script

**Files:**
- Create: `scripts/version-bump.mjs`
- Modify: `package.json` (add version script)

**Step 1: Create version bump script**

Create `scripts/version-bump.mjs`:
```js
import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
if (!targetVersion) {
  console.error("Usage: node scripts/version-bump.mjs <version>");
  process.exit(1);
}

// Validate semver format
if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
  console.error(`Invalid version format: ${targetVersion}`);
  process.exit(1);
}

// Update package.json
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
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
```

**Step 2: Add script to package.json**

Add to `scripts`:
```json
"version": "node scripts/version-bump.mjs"
```

**Step 3: Test the script** (dry run — don't commit the version change)

Run: `node scripts/version-bump.mjs 1.0.0`
Expected: Output `Bumped to 1.0.0 (minApp: 1.4.0)`, files unchanged since version is already 1.0.0.

**Step 4: Commit**

```bash
git add scripts/version-bump.mjs package.json
git commit -m "chore: add version bump script for manifest/versions/package sync"
```

---

## Task 9: Fix settings tab — remove single-section heading

**Files:**
- Modify: `src/settings.ts:39`

**Step 1: Read the current settings code**

The current code at `src/settings.ts:39` has:
```ts
new Setting(containerEl).setName("CiteMe").setHeading();
```

Per Obsidian developer guidelines, a single heading wrapping all settings is unnecessary when there is only one section. The heading should be removed.

**Step 2: Remove the heading**

Remove line 39:
```ts
new Setting(containerEl).setName("CiteMe").setHeading();
```

The settings tab should start directly with the "Access" setting.

**Step 3: Verify the build compiles**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/settings.ts
git commit -m "fix: remove unnecessary single-section heading from settings tab"
```

---

## Task 10: Add "Connect CiteMe Account" placeholder in settings

**Files:**
- Modify: `src/settings.ts`

**Step 1: Understand the current auth flow**

Currently the plugin uses anonymous API access with no authentication. The SaaS identifies users by IP for anonymous quota. This task adds a visible "Connect your CiteMe account" link in settings so users discover they can sign up, without implementing full OAuth/API key flow yet.

**Step 2: Add account connection link after Access setting**

In `src/settings.ts`, after the Access setting (around line 43), add:

```ts
new Setting(containerEl)
  .setName("CiteMe account")
  .setDesc(
    "Sign in at citeme.app to unlock more citations and Pro styles."
  )
  .addButton((btn) => {
    btn.setButtonText("Open citeme.app")
      .onClick(() => {
        window.open("https://citeme.app", "_blank");
      });
  });
```

**Step 3: Import CITEME_APP_URL**

Add to imports in `src/settings.ts`:
```ts
import { CITEME_APP_URL } from "./utils/constants";
```

Then use `CITEME_APP_URL` instead of the hardcoded string:
```ts
window.open(CITEME_APP_URL, "_blank");
```

**Step 4: Verify the build compiles**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add CiteMe account link in settings for user acquisition"
```

---

## Task 11: Add screenshot placeholders to README

**Files:**
- Modify: `README.md`

**Step 1: Understand the current state**

README.md has HTML comment placeholders for screenshots at lines 18-20. These need to be replaced with actual screenshot images or more descriptive placeholders with instructions.

**Step 2: Create screenshots directory and update README**

```bash
mkdir -p "/Volumes/SSD EXTERNO/Projetos de Codigo/obisidian-citeme/docs/screenshots"
```

Replace the HTML comments in README.md with image references:
```markdown
## Screenshots

> **Note:** Screenshots will be added before Community Plugin submission. To capture:
> 1. Open the plugin in Obsidian
> 2. Take screenshots of: search modal, settings tab, note with references
> 3. Save as `docs/screenshots/search-modal.png`, `settings-tab.png`, `references-section.png`
> 4. Replace this note with the image tags below

<!-- Uncomment when screenshots are ready:
![Search Modal](docs/screenshots/search-modal.png)
![Settings](docs/screenshots/settings-tab.png)
![References](docs/screenshots/references-section.png)
-->
```

**Step 3: Commit**

```bash
git add README.md docs/screenshots/
git commit -m "docs: add screenshot placeholders and instructions to README"
```

---

## Task 12: Final integration check

**Files:** None (verification only)

**Step 1: Run full CI pipeline locally**

```bash
npm run lint
npm run format:check
npx tsc -noEmit
npm test
npm run build
```

Expected: All pass with zero errors.

**Step 2: Verify smoke check**

```bash
node -e "
  const m = require('./manifest.json');
  const v = require('./versions.json');
  const p = require('./package.json');
  console.log('manifest.version:', m.version);
  console.log('package.version:', p.version);
  console.log('versions.json:', JSON.stringify(v));
  console.log('Match:', m.version === p.version && v[m.version] === m.minAppVersion);
"
```

Expected: `Match: true`

**Step 3: Verify git status is clean**

```bash
git status
git log --oneline -15
```

Expected: All changes committed, clean working tree.

**Step 4: Push to remote**

```bash
git push origin main
```

---

## Summary

| Task | Priority | Description |
|------|----------|-------------|
| 1 | P1 | ESLint + Prettier |
| 2 | P1/P2 | Vitest + access.ts tests |
| 3 | P2 | formatter.ts tests |
| 4 | P2 | Contract tests: style parity |
| 5 | P2 | Contract tests: quota headers |
| 6 | P1 | GitHub Actions CI |
| 7 | P3 | CHANGELOG.md |
| 8 | P1 | Version bump script |
| 9 | P5 | Settings heading fix |
| 10 | P4 | CiteMe account link |
| 11 | P3 | Screenshot placeholders |
| 12 | — | Final integration check |
