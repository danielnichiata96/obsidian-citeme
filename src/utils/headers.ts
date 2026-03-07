import type { QuotaInfo } from "./access";

export function extractQuotaInfo(
	headers: Record<string, string>
): QuotaInfo {
	return {
		used: parseNumberHeader(headers, "X-Quota-Used"),
		limit: parseNumberHeader(headers, "X-Quota-Limit"),
		remaining: parseNumberHeader(headers, "X-Quota-Remaining"),
		tier: readHeader(headers, "X-Quota-Tier"),
	};
}

export function parseNumberHeader(
	headers: Record<string, string>,
	name: string
): number | null {
	const value = readHeader(headers, name);
	if (value === null || value === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function readHeader(
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
