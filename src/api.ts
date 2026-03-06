import { requestUrl } from "obsidian";

export interface Paper {
	id: string;
	title: string;
	authors: string[];
	year: number;
	doi: string | null;
	venue: string | null;
	citationCount: number;
	abstract: string | null;
}

export interface FormattedCitation {
	bibliography: string;
	inText: string;
	inTextNarrative: string;
}

export interface CitationResult {
	paper: Paper;
	formatted: FormattedCitation;
}

export interface CiteResponse {
	success: boolean;
	data: {
		citations: CitationResult[];
		meta: {
			style: string;
			stats: { totalResults: number };
		};
	};
}

export interface SearchParams {
	query: string;
	style?: string;
	limit?: number;
	yearMin?: number;
	yearMax?: number;
	sourceType?: string;
	sortBy?: string;
}

export async function searchCitations(
	params: SearchParams,
	baseUrl: string
): Promise<CiteResponse> {
	const url = new URL(`${baseUrl}/api/v1/cite`);
	url.searchParams.set("q", params.query);
	if (params.style) url.searchParams.set("style", params.style);
	if (params.limit) url.searchParams.set("limit", String(params.limit));
	if (params.yearMin) url.searchParams.set("yearMin", String(params.yearMin));
	if (params.yearMax) url.searchParams.set("yearMax", String(params.yearMax));
	if (params.sourceType)
		url.searchParams.set("sourceType", params.sourceType);
	if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);

	let response;
	try {
		response = await requestUrl({ url: url.toString() });
	} catch {
		throw new Error(
			"Failed to connect to CiteMe API. Check your internet connection."
		);
	}

	const json = response.json;

	if (
		!json ||
		typeof json !== "object" ||
		!("success" in json) ||
		!("data" in json)
	) {
		throw new Error("Unexpected API response format");
	}

	if (!json.success) {
		throw new Error("CiteMe API returned an error");
	}

	return json as CiteResponse;
}
