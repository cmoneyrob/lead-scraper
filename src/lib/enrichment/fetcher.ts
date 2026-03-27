export interface FetchOptions {
  timeout?: number;
  maxSize?: number;
}

export interface FetchResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const USER_AGENT =
  "Mozilla/5.0 (compatible; LeadScraper/1.0; +https://example.com/bot)";

export async function fetchUrl(
  url: string,
  options?: FetchOptions
): Promise<FetchResult> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    const headers = extractHeaders(response.headers);

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      throw new FetchError(
        `Response too large: ${contentLength} bytes exceeds ${maxSize} byte limit`,
        response.status
      );
    }

    const html = await readBodyWithLimit(response, maxSize);

    return {
      html,
      statusCode: response.status,
      headers,
    };
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchError(`Request timed out after ${timeout}ms`, 0);
    }
    throw new FetchError(
      error instanceof Error ? error.message : "Unknown fetch error",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readBodyWithLimit(
  response: Response,
  maxSize: number
): Promise<string> {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxSize) {
      reader.cancel().catch(() => {});
      throw new FetchError(
        `Response body exceeded ${maxSize} byte limit`,
        response.status
      );
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join("");
}

function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "FetchError";
  }
}
