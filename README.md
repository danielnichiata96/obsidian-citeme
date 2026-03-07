# CiteMe - Academic Citations for Obsidian

Search and format academic citations from CiteMe directly in Obsidian, with quota-aware feedback and clear free/Pro style handling.

## Features

- **Instant search** - Search millions of academic papers without leaving Obsidian
- **Tier-aware citation styles** - Free styles are available immediately and Pro styles are clearly marked
- **Smart insertion** - Insert in-text citations, full bibliography entries, or both
- **References management** - Automatically builds and maintains a References section in your notes
- **Duplicate detection** - Prevents adding the same citation twice (checks by DOI and text)
- **DOI lookup** - Search directly by DOI for precise results
- **Quota visibility** - Shows current CiteMe usage in the Obsidian status bar
- **Mobile compatible** - Works on both desktop and mobile Obsidian

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

## Installation

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/danielnichiata96/obsidian-citeme/releases)
2. Create a folder `citeme` inside your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the `citeme` folder
4. Restart Obsidian and enable the plugin in Settings > Community Plugins

### From Source

```bash
cd obsidian-citeme
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault at `.obsidian/plugins/citeme/`.

## Usage

### Search Citations

- **Command palette**: Open command palette (Cmd/Ctrl+P) and type "CiteMe: Search citations"
- **Ribbon icon**: Click the book icon in the left sidebar
- **Right-click menu**: Select text, right-click, and choose "Search citation for selected text"

### Insert Modes

| Mode | What it inserts |
|------|----------------|
| **Bibliography** | Full formatted citation at cursor position |
| **In-text** | Parenthetical citation, e.g., `(Vaswani et al., 2017)` |
| **Narrative** | Narrative citation, e.g., `Vaswani et al. (2017)` |
| **Both** | In-text at cursor + full citation in References section |

### Access Tiers

- **Anonymous / Free**: 20 citations per month and 10 citation styles
- **Pro styles**: Marked as `(Pro)` in settings and require CiteMe Pro
- **Quota reached**: The plugin shows an actionable notice linking to CiteMe

### DOI Lookup

Use "CiteMe: Search by DOI" from the command palette to find a paper by its DOI. This opens a detail view with all formatted citation variants before inserting.

### References Section

When enabled (default), the plugin automatically:
1. Finds or creates a `## References` heading in your note
2. Appends full bibliography entries alphabetically
3. Skips duplicates (matched by DOI or exact text)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| CiteMe account | Link | Opens citeme.app to sign in or upgrade |
| Citation style | APA | Default citation format |
| Results limit | 5 | Number of search results (1-20) |
| Insert format | Bibliography | How citations are inserted |
| Sort by | Relevance | Result sorting order |
| Add to References | On | Auto-append to References section |
| References heading | `## References` | Heading text for the references section |

## Supported Citation Styles

Free styles: APA, MLA, ABNT, Chicago (Author-Date), Chicago (Note), IEEE, Harvard, Vancouver, AMA, ACS

Pro styles (33 additional): ABNT Numeric, Turabian, ASA, Bluebook, CSE, OSCOLA, MHRA, BMJ, Elsevier Harvard, SAGE Harvard, Taylor & Francis, Cambridge UP, Royal Society, DIN 1505, ISO 690 (German/French/Spanish/International), Nature, PLOS, Science, Cell, The Lancet, AIP, RSC, APSA, AAA, NP 405, Harvard (UCT/AGPS), AGLC4, Vancouver (Author-Date), McGill Guide

Pro styles are marked with `(Pro)` in the settings dropdown and require a [CiteMe Pro](https://citeme.app/pricing) subscription.

## Network & Privacy Disclosure

This plugin connects to the CiteMe API (https://citeme.app) to search academic databases and format citations. Requests are tagged with `X-Source: obsidian-plugin` for channel attribution. Anonymous access is available without an account. See CiteMe's privacy policy at https://citeme.app/privacy.

## Development

```bash
git clone https://github.com/danielnichiata96/obsidian-citeme.git
cd obsidian-citeme
npm install
npm run sync:saas-contract # Optional: refresh SaaS parity snapshot when ../citeme exists
npm run dev   # Watch mode (rebuilds on file change)
npm run build # Production build
```

## Links

- [CiteMe](https://citeme.app) - The citation search engine powering this plugin
- [Obsidian](https://obsidian.md) - A powerful knowledge base on top of a local folder of plain text Markdown files

## License

MIT
