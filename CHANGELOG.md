# Changelog

All notable changes to the CiteMe plugin for Obsidian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-10-04

### Fixed
- "Check references in this note" no longer sends the continuation lines of a multi-line footnote at the end of the note; the whole footnote stays out of the check.

## [1.1.0] - 2026-10-04

### Added
- "Check references in this note" checks the selected references, or the entries under the References heading, with CiteMe's reference checker. Each reference is marked found, to review, or not found, with the DOI of the matching record. "Check selected references" does the same from the right-click menu.
- Optional "CiteMe token" setting. With a token, reference checks use your CiteMe plan; CiteMe Pro has no monthly limit. Without one, a check covers up to 10 references and each network gets 5 checks a month.

## [1.0.2] - 2026-10-04

### Fixed
- After inserting a citation, the cursor sits after it. It used to stay in front, so the next keystroke landed before the citation.
- Timers use `window.setTimeout()`/`window.clearTimeout()`, so search and the DOI dialog work in popout windows.

### Changed
- The "Open citeme.app" button in settings carries UTM parameters, so CiteMe can count visits that come from the plugin.
- The build no longer depends on the `builtin-modules` package; it reads Node's own `node:module` list.
- Releases are built, attested and published by GitHub Actions from a version tag.

## [1.0.1] - 2026-09-25

### Fixed
- Inserting in the default "bibliography" mode inserted nothing: the plugin read a `bibliography` field the CiteMe API never returned. It now reads `reference`.
- Authors showed as `[object Object]`; the API returns author objects and the plugin now shows their names.
- Formatted citations are converted from the API's HTML to Markdown (italics, bold, superscript, DOI links) instead of being pasted as raw tags.
- The status bar stayed on "CiteMe: Anonymous"; it now reads the 24-hour usage headers the API sends.
- 33 styles were refused as "Pro" although the API formats them for everyone. All 60 curated styles are now available, with CiteMe's display names.

### Changed
- Removed the "narrative" insert mode, which the API never supported; saved settings move to "in-text".
- Search waits 800 ms after the last keystroke (was 300 ms), so typing spends fewer searches.
- Removed sign-in and upgrade prompts: the plugin sends no credentials, so an account did not change its limits.
- Contract tests now pin the plugin to the CiteMe web app's source (styles, response fields, usage headers).

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
