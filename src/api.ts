import { requestUrl } from "obsidian";
import { CITEME_SOURCE_HEADER } from "./utils/constants";
import type { QuotaInfo } from "./utils/access";
import { extractQuotaInfo } from "./utils/headers";
import {
	type CitationResult,
	normalizeCitationResult,
} from "./utils/citation-result";

export type {
	CitationResult,
	FormattedCitation,
	Paper,
} from "./utils/citation-result";

export interface CiteResponse {
	citations: CitationResult[];
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

export type CiteMeApiErrorCode = "network" | "quota_exceeded" | "api";

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
	const url = buildCiteApiUrl(params, baseUrl);

	let response;
	try {
		response = await requestUrl({
			url: url.toString(),
			headers: {
				"X-Source": CITEME_SOURCE_HEADER,
			},
			throw: false,
		});
	} catch (error) {
		throw buildRequestError(error);
	}

	const quota = extractQuotaInfo(response.headers);
	if (response.status >= 400) {
		throw buildApiError(
			response.status,
			response.text,
			quota,
			params.style
		);
	}

	const json = response.json as unknown;
	if (
		json &&
		typeof json === "object" &&
		(json as { success?: unknown }).success === false
	) {
		throw buildApiError(
			response.status,
			response.text,
			quota,
			params.style
		);
	}
	const data =
		json &&
		typeof json === "object" &&
		(json as { success?: unknown }).success
			? (json as { data?: { citations?: unknown } }).data
			: undefined;
	if (!data || !Array.isArray(data.citations)) {
		throw new CiteMeApiError(
			"api",
			"Unexpected API response format",
			response.status,
			quota,
			params.style ?? null
		);
	}

	return {
		citations: data.citations.map(normalizeCitationResult),
		quota,
	};
}

function buildCiteApiUrl(params: SearchParams, baseUrl: string): URL {
	let url: URL;
	try {
		url = new URL(`${baseUrl}/api/v1/cite`);
	} catch {
		throw new CiteMeApiError("api", `Invalid API base URL: ${baseUrl}`);
	}

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

	return url;
}

function buildRequestError(error: unknown): CiteMeApiError {
	if (error instanceof CiteMeApiError) {
		return error;
	}

	return new CiteMeApiError(
		"network",
		"Failed to connect to CiteMe API. Check your internet connection."
	);
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
			message || "CiteMe search limit reached. Try again later.",
			status,
			quota,
			style ?? null
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
