export interface ExtractedContacts {
  emails: string[];
  phones: string[];
  addresses: string[];
  contactPageUrl: string | null;
}

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
  contacts?: ExtractedContacts;
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
