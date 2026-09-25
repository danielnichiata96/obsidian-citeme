# Changelog

All notable changes to the CiteMe plugin for Obsidian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - Unreleased

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
