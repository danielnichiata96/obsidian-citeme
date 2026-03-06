# CiteMe - Academic Citations for Obsidian

Search and format academic citations from 11+ databases directly in Obsidian. Supports 40+ citation styles including APA, MLA, ABNT, Chicago, IEEE, Harvard, Vancouver, and more.

## Features

- **Instant search** - Search millions of academic papers without leaving Obsidian
- **40+ citation styles** - APA, MLA, ABNT, Chicago, IEEE, Harvard, Vancouver, Nature, Science, and more
- **Smart insertion** - Insert in-text citations, full bibliography entries, or both
- **References management** - Automatically builds and maintains a References section in your notes
- **Duplicate detection** - Prevents adding the same citation twice (checks by DOI and text)
- **DOI lookup** - Search directly by DOI for precise results
- **Mobile compatible** - Works on both desktop and mobile Obsidian

## Screenshots

<!-- Screenshot: Search modal showing results for "transformer attention mechanism" with title, authors, year, venue, and citation count -->
<!-- Screenshot: Settings tab showing citation style dropdown, insert format options, and references heading configuration -->
<!-- Screenshot: Note with in-text citations and auto-generated References section at the bottom -->

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
| Citation style | APA | Default citation format |
| Results limit | 5 | Number of search results (1-20) |
| Insert format | Bibliography | How citations are inserted |
| Sort by | Relevance | Result sorting order |
| Add to References | On | Auto-append to References section |
| References heading | `## References` | Heading text for the references section |
| API base URL | `https://citeme.app` | API endpoint (for self-hosting) |

## Supported Citation Styles

APA (7th/6th), MLA (9th/8th), ABNT, ABNT (Numeric), Chicago (Author-Date, Note, Full Note), IEEE, Harvard, Elsevier Harvard, SAGE Harvard, Vancouver, AMA, ACS, ACM, Nature, Science, Cell, OSCOLA, Turabian, ASA, Bluebook, DIN 1505, AIST, MHRA, ISO 690, GOST, CSE, APSA, Annual Reviews, Springer, Taylor & Francis, RSC, AIP, APS, Copernicus, Unified Linguistics, and more

## Network & Privacy Disclosure

This plugin connects to the CiteMe API (https://citeme.app) to search academic databases and format citations. No account is required. No personal data is collected. See CiteMe's privacy policy at https://citeme.app/privacy.

## Development

```bash
git clone https://github.com/danielnichiata96/obsidian-citeme.git
cd obsidian-citeme
npm install
npm run dev   # Watch mode (rebuilds on file change)
npm run build # Production build
```

## Links

- [CiteMe](https://citeme.app) - The citation search engine powering this plugin
- [Obsidian](https://obsidian.md) - A powerful knowledge base on top of a local folder of plain text Markdown files

## License

MIT
