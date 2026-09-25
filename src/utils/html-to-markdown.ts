/**
 * Converts the inline HTML the CiteMe API puts in formatted citations
 * (CSL output: italic/bold spans, super/subscript, DOI links) into text that
 * reads correctly in a Markdown note. Pure string processing so it runs the
 * same in tests as inside Obsidian.
 */

interface ElementNode {
	open: string;
	close: string;
	children: Node[];
}

type Node = string | ElementNode;

const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export function htmlToMarkdown(html: string): string {
	return render(parse(html));
}

function parse(html: string): Node[] {
	const root: ElementNode = { open: "", close: "", children: [] };
	const stack: Array<{ tag: string; node: ElementNode }> = [
		{ tag: "", node: root },
	];
	const token = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+|<)/g;
	let match: RegExpExecArray | null;

	while ((match = token.exec(html)) !== null) {
		const [, closing, rawTag, attributes, text] = match;
		const top = stack[stack.length - 1];

		if (text !== undefined) {
			top.node.children.push(decodeEntities(text));
			continue;
		}

		const tag = rawTag.toLowerCase();
		if (closing) {
			const index = findOpen(stack, tag);
			if (index > 0) stack.length = index;
			continue;
		}

		if (tag === "br") {
			top.node.children.push(" ");
			continue;
		}

		const [open, close] = wrapperFor(tag, attributes);
		const node: ElementNode = { open, close, children: [] };
		top.node.children.push(node);
		if (!attributes.trim().endsWith("/")) stack.push({ tag, node });
	}

	return root.children;
}

function findOpen(
	stack: Array<{ tag: string; node: ElementNode }>,
	tag: string
): number {
	for (let i = stack.length - 1; i > 0; i--) {
		if (stack[i].tag === tag) return i;
	}
	return -1;
}

function wrapperFor(tag: string, attributes: string): [string, string] {
	const style = (attributes.match(/style\s*=\s*"([^"]*)"/i) || [])[1] || "";
	if (tag === "i" || tag === "em" || /font-style:\s*italic/i.test(style)) {
		return ["*", "*"];
	}
	if (tag === "b" || tag === "strong" || /font-weight:\s*bold/i.test(style)) {
		return ["**", "**"];
	}
	if (tag === "sup" || /vertical-align:\s*super/i.test(style)) {
		return ["<sup>", "</sup>"];
	}
	if (tag === "sub" || /vertical-align:\s*sub/i.test(style)) {
		return ["<sub>", "</sub>"];
	}
	return ["", ""];
}

function render(nodes: Node[]): string {
	return nodes
		.map((node) => {
			if (typeof node === "string") return node;
			const inner = render(node.children);
			if (!node.open) return inner;
			const trimmed = inner.trim();
			if (!trimmed) return inner;
			// Markdown emphasis does not open/close next to whitespace, so keep
			// any edge spaces outside the markers.
			const lead = (inner.match(/^\s*/) || [""])[0];
			const trail = (inner.match(/\s*$/) || [""])[0];
			return `${lead}${node.open}${trimmed}${node.close}${trail}`;
		})
		.join("");
}

function decodeEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, code) => {
		const lower = String(code).toLowerCase();
		if (lower.startsWith("#x")) {
			return String.fromCodePoint(parseInt(lower.slice(2), 16));
		}
		if (lower.startsWith("#")) {
			return String.fromCodePoint(parseInt(lower.slice(1), 10));
		}
		return ENTITIES[lower] ?? entity;
	});
}
