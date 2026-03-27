export interface BraveSearchParams {
  q: string;
  country?: string;
  search_lang?: string;
  count?: number;
  offset?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
  result_filter?: string;
}

export interface BraveSearchResponse {
  query: { original: string; altered?: string };
  mixed?: { type: string; main: BraveResult[] };
  web?: { results: BraveWebResult[] };
  infobox?: { results: BraveInfoboxResult[] };
}

export interface BraveResult {
  type: string;
  index: number;
  all: boolean;
}

export interface BraveMetaUrl {
  scheme: string;
  netloc: string;
  hostname: string;
  favicon: string;
  path: string;
}

export interface BraveDeepResultButton {
  type: string;
  title: string;
  url: string;
}

export interface BraveProfile {
  name: string;
  url: string;
  img: string;
}

export interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  is_source_local: boolean;
  is_source_both: boolean;
  language: string;
  family_friendly: boolean;
  type: string;
  subtype: string;
  meta_url: BraveMetaUrl;
  age?: string;
  extra_snippets?: string[];
  deep_results?: { buttons: BraveDeepResultButton[] };
  profile?: BraveProfile;
}

export interface BraveInfoboxResult {
  title: string;
  url: string;
  description: string;
  type: string;
  subtype: string;
  long_desc?: string;
  images?: { src: string; original: string }[];
  attributes?: Record<string, string>;
  profiles?: BraveProfile[];
  website_url?: string;
  ratings?: { value: number; best: number; vote_count: number }[];
}
