export interface EnrichmentData {
  content: string;
  title: string;
  metaDescription: string;
  technologies: string[];
  socialLinks: SocialLink[];
  links: string[];
  wordCount: number;
  imageCount: number;
  linkCount: number;
  headers: Record<string, string>;
  domainAge?: number;
  fetchedAt: string;
  statusCode: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface EnrichmentResult {
  success: boolean;
  data?: EnrichmentData;
  error?: string;
}
