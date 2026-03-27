import * as cheerio from "cheerio";
import { EnrichmentData } from "./types";
import { detectTechnologies } from "./tech-detector";
import { extractSocialLinks } from "./social-extractor";
import { extractContacts } from "./contact-extractor";

export function parseHtml(
  html: string,
  url: string,
  statusCode: number = 200,
  headers: Record<string, string> = {}
): EnrichmentData {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  const metaDescription = extractMetaDescription($);
  const links = extractLinks($, url);
  const imageCount = $("img").length;
  const technologies = detectTechnologies(html, headers);
  const socialLinks = extractSocialLinks(html, links);
  const contacts = extractContacts(html, links);

  $("script, style, nav, header, footer, noscript, iframe, svg").remove();

  const content = extractCleanText($);
  const wordCount = countWords(content);

  return {
    content,
    title,
    metaDescription,
    technologies,
    socialLinks,
    links,
    wordCount,
    imageCount,
    linkCount: links.length,
    headers,
    contacts,
    fetchedAt: new Date().toISOString(),
    statusCode,
  };
}

function extractTitle($: cheerio.CheerioAPI): string {
  return $("title").first().text().trim() || $("h1").first().text().trim() || "";
}

function extractMetaDescription($: cheerio.CheerioAPI): string {
  return (
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    ""
  );
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const resolved = resolveUrl(href, baseUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      links.push(resolved);
    }
  });

  return links;
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return null;
    }
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extractCleanText($: cheerio.CheerioAPI): string {
  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}
