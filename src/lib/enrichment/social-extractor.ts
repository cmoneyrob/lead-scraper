import { SocialLink } from "./types";

interface SocialPlatform {
  name: string;
  patterns: RegExp[];
  normalizer: (url: string) => string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: "LinkedIn",
    patterns: [
      /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9_-]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
  {
    name: "Twitter",
    patterns: [
      /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?/gi,
    ],
    normalizer: (url) =>
      url.replace(/^https?:\/\/(?:www\.)?twitter\.com/i, "https://x.com").replace(/\/$/, ""),
  },
  {
    name: "Facebook",
    patterns: [
      /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
  {
    name: "Instagram",
    patterns: [
      /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
  {
    name: "YouTube",
    patterns: [
      /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|@)[/a-zA-Z0-9_-]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
  {
    name: "GitHub",
    patterns: [
      /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
  {
    name: "TikTok",
    patterns: [
      /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?/gi,
    ],
    normalizer: (url) => url.replace(/\/$/, ""),
  },
];

export function extractSocialLinks(
  html: string,
  links: string[]
): SocialLink[] {
  const seen = new Set<string>();
  const results: SocialLink[] = [];

  const allText = html + "\n" + links.join("\n");

  for (const platform of SOCIAL_PLATFORMS) {
    for (const pattern of platform.patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(allText)) !== null) {
        const normalized = platform.normalizer(match[0]);

        if (isExcludedSocialUrl(normalized)) {
          continue;
        }

        const key = `${platform.name}:${normalized.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ platform: platform.name, url: normalized });
        }
      }
    }
  }

  return results;
}

function isExcludedSocialUrl(url: string): boolean {
  const excludedPaths = [
    "/share",
    "/sharer",
    "/intent/tweet",
    "/login",
    "/signup",
    "/help",
    "/about",
    "/privacy",
    "/terms",
    "/policies",
    "/settings",
  ];

  const lower = url.toLowerCase();
  return excludedPaths.some((path) => lower.includes(path));
}
