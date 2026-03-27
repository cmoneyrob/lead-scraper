import { BraveWebResult } from "./types";

export interface ParsedLead {
  company_name: string;
  domain: string;
  url: string;
  title: string;
  description: string;
  raw_search_result: BraveWebResult;
}

export function parseBraveResults(results: BraveWebResult[]): ParsedLead[] {
  return results.map((result) => ({
    company_name: extractCompanyName(result),
    domain: extractDomain(result.url),
    url: result.url,
    title: result.title,
    description: result.description,
    raw_search_result: result,
  }));
}

function extractCompanyName(result: BraveWebResult): string {
  if (result.profile?.name) {
    return result.profile.name;
  }

  const hostname = result.meta_url?.hostname ?? extractHostname(result.url);
  const titleParts = result.title.split(/\s[-|:]\s/);

  if (titleParts.length > 1) {
    return titleParts[0].trim();
  }

  return cleanHostname(hostname);
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function cleanHostname(hostname: string): string {
  return hostname
    .replace(/^www\./, "")
    .replace(/\.(com|org|net|io|co|ai|dev|app)$/i, "")
    .split(".")
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) ?? hostname;
}
