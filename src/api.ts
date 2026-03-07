import { requestUrl } from "obsidian";
import {
	CITEME_SOURCE_HEADER,
} from "./utils/constants";
import {
	type QuotaInfo,
	isProStyle,
} from "./utils/access";

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
	quota: QuotaInfo;
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

export type CiteMeApiErrorCode =
	| "network"
	| "quota_exceeded"
	| "style_requires_pro"
	| "api";

export class CiteMeApiError extends Error {
	code: CiteMeApiErrorCode;
	status: number | null;
	quota: QuotaInfo | null;
	style: string | null;

	constructor(
		code: CiteMeApiErrorCode,
		message: string,
		status: number | null = null,
		quota: QuotaInfo | null = null,
		style: string | null = null
	) {
		super(message);
		this.name = "CiteMeApiError";
		this.code = code;
		this.status = status;
		this.quota = quota;
		this.style = style;
	}
}

export async function searchCitations(
	params: SearchParams,
	baseUrl: string
): Promise<CiteResponse> {
	try {
		const url = new URL(`${baseUrl}/api/v1/cite`);
		url.searchParams.set("q", params.query);

		if (params.style) {
			url.searchParams.set("style", params.style);
		}
		if (params.limit) {
			url.searchParams.set("limit", String(params.limit));
		}
		if (params.yearMin) {
			url.searchParams.set("yearMin", String(params.yearMin));
		}
		if (params.yearMax) {
			url.searchParams.set("yearMax", String(params.yearMax));
		}
		if (params.sourceType) {
			url.searchParams.set("sourceType", params.sourceType);
		}
		if (params.sortBy) {
			url.searchParams.set("sortBy", params.sortBy);
		}

		const response = await requestUrl({
			url: url.toString(),
			headers: {
				"X-Source": CITEME_SOURCE_HEADER,
			},
			throw: false,
		});

		const quota = extractQuotaInfo(response.headers);
		if (response.status >= 400) {
			throw buildApiError(
				response.status,
				response.text,
				quota,
				params.style
			);
		}

		const json = response.json;
		if (
			!json ||
			typeof json !== "object" ||
			!("success" in json) ||
			!("data" in json)
		) {
			throw new CiteMeApiError(
				"api",
				"Unexpected API response format",
				response.status,
				quota,
				params.style ?? null
			);
		}

		if (!json.success) {
			throw buildApiError(
				response.status,
				response.text,
				quota,
				params.style
			);
		}

		return {
			...(json as Omit<CiteResponse, "quota">),
			quota,
		};
	} catch (error) {
		if (error instanceof CiteMeApiError) {
			throw error;
		}

		throw new CiteMeApiError(
			"network",
			"Failed to connect to CiteMe API. Check your internet connection."
		);
	}
}

function extractQuotaInfo(headers: Record<string, string>): QuotaInfo {
	return {
		used: parseNumberHeader(headers, "X-Quota-Used"),
		limit: parseNumberHeader(headers, "X-Quota-Limit"),
		remaining: parseNumberHeader(headers, "X-Quota-Remaining"),
		tier: readHeader(headers, "X-Quota-Tier"),
	};
}

function parseNumberHeader(
	headers: Record<string, string>,
	name: string
): number | null {
	const value = readHeader(headers, name);
	if (!value) {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function readHeader(
	headers: Record<string, string>,
	name: string
): string | null {
	const target = name.toLowerCase();

	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() === target) {
			return value;
		}
	}

	return null;
}

function buildApiError(
	status: number,
	body: string,
	quota: QuotaInfo,
	style?: string
): CiteMeApiError {
	const message = extractApiErrorMessage(body);

	if (
		status === 429 ||
		quota.remaining === 0 ||
		(quota.limit !== null &&
			quota.used !== null &&
			quota.used >= quota.limit)
	) {
		return new CiteMeApiError(
			"quota_exceeded",
			message || "Monthly citation limit reached.",
			status,
			quota,
			style ?? null
		);
	}

	if (status === 403 && style && isProStyle(style)) {
		return new CiteMeApiError(
			"style_requires_pro",
			message || "This citation style requires CiteMe Pro.",
			status,
			quota,
			style
		);
	}

	return new CiteMeApiError(
		"api",
		message || `CiteMe API returned ${status}.`,
		status,
		quota,
		style ?? null
	);
}

function extractApiErrorMessage(body: string): string | null {
	if (!body) {
		return null;
	}

	try {
		const json = JSON.parse(body) as Record<string, unknown>;
		const candidates = [json.message, json.error, json.detail];

		for (const candidate of candidates) {
			if (typeof candidate === "string" && candidate.trim()) {
				return candidate.trim();
			}
		}
	} catch {
		// Fall through to plain text response.
	}

	const text = body.trim();
	return text || null;
}
