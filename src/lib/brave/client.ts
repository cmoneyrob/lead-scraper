import {
  BraveSearchParams,
  BraveSearchResponse,
} from "./types";

export class BraveSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = "BraveSearchError";
  }
}

export class BraveSearchClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.search.brave.com/res/v1/web/search";
  private lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL_MS = 1000;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.BRAVE_API_KEY;
    if (!key) {
      throw new Error(
        "Brave API key is required. Pass it to the constructor or set BRAVE_API_KEY."
      );
    }
    this.apiKey = key;
  }

  async webSearch(params: BraveSearchParams): Promise<BraveSearchResponse> {
    await this.enforceRateLimit();

    const url = this.buildUrl(params);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => undefined);
      throw new BraveSearchError(
        `Brave Search API returned ${response.status}: ${response.statusText}`,
        response.status,
        body
      );
    }

    const data = (await response.json()) as BraveSearchResponse;
    return data;
  }

  private buildUrl(params: BraveSearchParams): URL {
    const url = new URL(this.baseUrl);

    url.searchParams.set("q", params.q);

    if (params.country !== undefined) {
      url.searchParams.set("country", params.country);
    }
    if (params.search_lang !== undefined) {
      url.searchParams.set("search_lang", params.search_lang);
    }
    if (params.count !== undefined) {
      url.searchParams.set("count", String(params.count));
    }
    if (params.offset !== undefined) {
      url.searchParams.set("offset", String(params.offset));
    }
    if (params.freshness !== undefined) {
      url.searchParams.set("freshness", params.freshness);
    }
    if (params.result_filter !== undefined) {
      url.searchParams.set("result_filter", params.result_filter);
    }

    return url;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remaining = BraveSearchClient.MIN_REQUEST_INTERVAL_MS - elapsed;

    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }

    this.lastRequestTime = Date.now();
  }
}
