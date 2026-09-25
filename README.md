# CiteMe - Academic Citations for Obsidian

Search scholarly databases and insert formatted citations from CiteMe directly in Obsidian. No account needed.

## Features

- **Instant search** - Search millions of academic papers without leaving Obsidian
- **60 citation styles** - APA, MLA, Chicago, Harvard, IEEE, Vancouver, ABNT, and more, all available without an account
- **Smart insertion** - Insert in-text citations, full bibliography entries, or both
- **References management** - Automatically builds and maintains a References section in your notes
- **Duplicate detection** - Prevents adding the same citation twice (checks by DOI and text)
- **DOI lookup** - Search directly by DOI for precise results
- **Usage visibility** - Shows your searches in the last 24 hours in the Obsidian status bar
- **Mobile compatible** - Works on both desktop and mobile Obsidian

## Screenshots

*Coming soon — screenshots will be added in a future release.*

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

- **Command palette**: Open command palette (Cmd/Ctrl+P) and type "Search citations"
- **Ribbon icon**: Click the book icon in the left sidebar
- **Right-click menu**: Select text, right-click, and choose "Search citation for selected text"

### Insert Modes

| Mode | What it inserts |
|------|----------------|
| **Bibliography** | Full formatted citation at cursor position, with italics as Markdown |
| **In-text** | The style's in-text citation, e.g., `(Vaswani et al., 2017)` |
| **Both** | In-text at cursor + full citation in References section |

### Limits

The plugin needs no account. Searches share CiteMe's anonymous budget of 500 searches per 24 hours per network, and the status bar shows how many you have used. Search runs after you pause typing, so each query costs one search.

### DOI Lookup

Use "Search by DOI" from the command palette to find a paper by its DOI. This opens a detail view with all formatted citation variants before inserting.

### References Section

When enabled (default), the plugin automatically:
1. Finds or creates a `## References` heading in your note
2. Appends full bibliography entries alphabetically
3. Skips duplicates (matched by DOI or exact text)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| CiteMe on the web | Link | Opens citeme.app (library, reference checking, exports) |
| Citation style | APA | Default citation format |
| Results limit | 5 | Number of search results (1-20) |
| Insert format | Bibliography | How citations are inserted |
| Sort by | Relevance | Result sorting order |
| Add to References | On | Auto-append to References section |
| References heading | `## References` | Heading text for the references section |

## Supported Citation Styles

All 60 curated CiteMe styles are available, including APA, MLA, Chicago (Author-Date and Note), Harvard, IEEE, Vancouver, ABNT, AMA, ACS, Turabian, OSCOLA, Bluebook, Nature, Science, Cell, The Lancet, ISO 690, DIN 1505, and German and French university styles. The list is kept in sync with CiteMe by `npm run sync:saas-contract`.

## Network & Privacy Disclosure

This plugin connects to the CiteMe API (https://citeme.app) to search academic databases and format citations. Your search text is sent to CiteMe to run the search. Requests are tagged with `X-Source: obsidian-plugin` for channel attribution and carry no account credentials. See CiteMe's privacy policy at https://citeme.app/privacy.

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
