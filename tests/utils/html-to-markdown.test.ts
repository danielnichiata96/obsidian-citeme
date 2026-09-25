import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "../../src/utils/html-to-markdown";

// Samples are verbatim `formatted` values from GET /api/v1/cite (2026-09-25).
describe("htmlToMarkdown", () => {
	it("turns CSL italics into Markdown emphasis", () => {
		expect(
			htmlToMarkdown(
				'LeCun, Y., Bengio, Y., &amp; Hinton, G. E. (2015). Deep learning. <span style="font-style: italic;">Nature</span>, <span style="font-style: italic;">521</span>(7553), 436–444.'
			)
		).toBe(
			"LeCun, Y., Bengio, Y., & Hinton, G. E. (2015). Deep learning. *Nature*, *521*(7553), 436–444."
		);
	});

	it("turns CSL bold into Markdown strong", () => {
		expect(
			htmlToMarkdown(
				'1. Vaswani, A. <span style="font-style: italic;">et al.</span> Attention Is All You Need. <span style="font-weight: bold;">30,</span> 5998–6008 (2025).'
			)
		).toBe(
			"1. Vaswani, A. *et al.* Attention Is All You Need. **30,** 5998–6008 (2025)."
		);
	});

	it("keeps a DOI link as its visible text", () => {
		expect(
			htmlToMarkdown(
				'Deep learning. https://doi.org/<a href="https://doi.org/10.1038/nature14539">10.1038/nature14539</a>'
			)
		).toBe("Deep learning. https://doi.org/10.1038/nature14539");
	});

	it("renders superscript citation numbers as <sup>", () => {
		expect(
			htmlToMarkdown('<span style="vertical-align: super;">1</span>')
		).toBe("<sup>1</sup>");
	});

	it("moves edge whitespace outside emphasis so Markdown still parses", () => {
		expect(htmlToMarkdown("In <i> Nature </i>today")).toBe(
			"In  *Nature* today"
		);
	});

	it("drops unknown wrappers and decodes entities", () => {
		expect(
			htmlToMarkdown(
				'<div class="csl-entry">Smith &#38; Jones &lt;2020&gt; &quot;Title&quot;</div>'
			)
		).toBe('Smith & Jones <2020> "Title"');
	});

	it("returns plain text unchanged", () => {
		expect(htmlToMarkdown("(LeCun et al., 2015)")).toBe(
			"(LeCun et al., 2015)"
		);
	});
});
