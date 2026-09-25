import type { Editor } from "obsidian";
import type { CitationResult } from "./citation-result";
import type { InsertFormat } from "./settings-migration";

export type { InsertFormat } from "./settings-migration";

export function insertCitation(
	editor: Editor,
	result: CitationResult,
	format: InsertFormat,
	addToReferences: boolean,
	referencesHeading: string
): void {
	const cursor = editor.getCursor();

	switch (format) {
		case "bibliography":
			editor.replaceRange(result.formatted.reference, cursor);
			break;
		case "inText":
			editor.replaceRange(result.formatted.inText, cursor);
			break;
		case "both":
			editor.replaceRange(result.formatted.inText, cursor);
			appendToReferencesSection(
				editor,
				result.formatted.reference,
				result.paper.doi,
				referencesHeading
			);
			break;
	}

	if (format !== "both" && addToReferences && format !== "bibliography") {
		appendToReferencesSection(
			editor,
			result.formatted.reference,
			result.paper.doi,
			referencesHeading
		);
	}
}

interface EntryBlock {
	startLine: number;
	endLine: number; // exclusive
	text: string;
}

function appendToReferencesSection(
	editor: Editor,
	bibliography: string,
	doi: string | null,
	heading: string
): void {
	const normalizedHeading = normalizeHeading(heading);
	const content = editor.getValue();
	const lines = content.split("\n");

	const headingIndex = findHeadingIndex(lines, normalizedHeading);

	if (headingIndex === -1) {
		// Check duplicate against full document before creating section
		if (isDuplicateEntry(lines, 0, lines.length, bibliography, doi)) {
			return;
		}
		const lastLine = editor.lastLine();
		const suffix = content.endsWith("\n") ? "" : "\n";
		const insertion = `${suffix}\n${normalizedHeading}\n\n${bibliography}\n`;
		editor.replaceRange(insertion, {
			line: lastLine,
			ch: lines[lastLine].length,
		});
	} else {
		const sectionEnd = findSectionEnd(lines, headingIndex);

		// Check duplicate only within the references section
		if (
			isDuplicateEntry(lines, headingIndex, sectionEnd, bibliography, doi)
		) {
			return;
		}

		const entries = parseEntryBlocks(lines, headingIndex, sectionEnd);
		const insertionLine = findAlphabeticalInsertionLine(
			entries,
			bibliography,
			sectionEnd
		);

		// Ensure blank line separation between entries
		const needsLeadingBlank =
			insertionLine > 0 &&
			insertionLine < lines.length &&
			lines[insertionLine - 1].trim() !== "";
		const needsTrailingBlank =
			insertionLine < lines.length &&
			lines[insertionLine].trim() !== "" &&
			lines[insertionLine].trim() !== normalizedHeading;

		let insertion = bibliography + "\n";
		if (needsLeadingBlank) {
			insertion = "\n" + insertion;
		}
		if (needsTrailingBlank) {
			insertion = insertion + "\n";
		}

		editor.replaceRange(insertion, { line: insertionLine, ch: 0 });
	}
}

function normalizeHeading(heading: string): string {
	const text = heading.replace(/^#+\s*/, "").trim();
	if (!text) {
		return "## References";
	}
	const match = heading.match(/^(#+)/);
	const hashes = match ? match[1] : "##";
	return `${hashes} ${text}`;
}

function isDuplicateEntry(
	lines: string[],
	startLine: number,
	endLine: number,
	bibliography: string,
	doi: string | null
): boolean {
	const bibTrimmed = bibliography.trim();
	const entries = parseEntryBlocks(lines, startLine, endLine);

	for (const entry of entries) {
		// Exact text match on full entry block
		if (entry.text.trim() === bibTrimmed) {
			return true;
		}
	}

	// DOI exact match: look for the DOI as a standalone token in the section
	if (doi) {
		const sectionText = lines.slice(startLine, endLine).join("\n");
		const doiPattern = new RegExp(
			"(?:^|[\\s,;(])(" +
				doi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
				")(?:$|[\\s,;)])",
			"m"
		);
		if (doiPattern.test(sectionText)) {
			return true;
		}
	}

	return false;
}

function parseEntryBlocks(
	lines: string[],
	headingIndex: number,
	sectionEnd: number
): EntryBlock[] {
	const entries: EntryBlock[] = [];
	let contentStart = headingIndex + 1;

	// Skip blank lines after heading
	while (contentStart < sectionEnd && lines[contentStart].trim() === "") {
		contentStart++;
	}

	let blockStart = -1;
	for (let i = contentStart; i < sectionEnd; i++) {
		const line = lines[i].trim();

		if (line === "") {
			// Blank line: close current block if open
			if (blockStart !== -1) {
				entries.push({
					startLine: blockStart,
					endLine: i,
					text: lines
						.slice(blockStart, i)
						.map((l) => l.trim())
						.filter((l) => l !== "")
						.join(" "),
				});
				blockStart = -1;
			}
		} else {
			// Non-blank line: start or continue a block
			if (blockStart === -1) {
				blockStart = i;
			}
		}
	}

	// Close last block
	if (blockStart !== -1) {
		entries.push({
			startLine: blockStart,
			endLine: sectionEnd,
			text: lines
				.slice(blockStart, sectionEnd)
				.map((l) => l.trim())
				.filter((l) => l !== "")
				.join(" "),
		});
	}

	return entries;
}

function findAlphabeticalInsertionLine(
	entries: EntryBlock[],
	bibliography: string,
	sectionEnd: number
): number {
	const bibLower = bibliography.toLowerCase();

	for (const entry of entries) {
		if (entry.text.toLowerCase() > bibLower) {
			return entry.startLine;
		}
	}

	// After all existing entries
	if (entries.length > 0) {
		const lastEntry = entries[entries.length - 1];
		return lastEntry.endLine;
	}

	return sectionEnd;
}

export function findHeadingIndex(lines: string[], heading: string): number {
	const normalized = normalizeHeading(heading);
	const headingText = normalized
		.replace(/^#+\s*/, "")
		.trim()
		.toLowerCase();
	const headingLevel = (normalized.match(/^#+/) || [""])[0].length;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		const lineMatch = line.match(/^(#+)\s+(.*)/);
		if (!lineMatch) continue;

		const lineLevel = lineMatch[1].length;
		const lineText = lineMatch[2].trim().toLowerCase();

		if (lineLevel === headingLevel && lineText === headingText) {
			return i;
		}
	}
	return -1;
}

export function findSectionEnd(lines: string[], headingIndex: number): number {
	const headingLine = lines[headingIndex];
	const match = headingLine.match(/^#+/);
	if (!match) return lines.length;
	const headingLevel = match[0].length;

	for (let i = headingIndex + 1; i < lines.length; i++) {
		const lineMatch = lines[i].trim().match(/^#+/);
		if (lineMatch && lineMatch[0].length <= headingLevel) {
			return i;
		}
	}
	return lines.length;
}
