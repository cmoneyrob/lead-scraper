interface TechPattern {
  name: string;
  scripts?: RegExp[];
  meta?: RegExp[];
  headers?: { key: string; pattern: RegExp }[];
  html?: RegExp[];
}

const TECH_PATTERNS: TechPattern[] = [
  {
    name: "React",
    scripts: [/react(?:\.min)?\.js/i, /react-dom/i],
    html: [/data-reactroot/i, /data-reactid/i, /__NEXT_DATA__/],
  },
  {
    name: "Next.js",
    scripts: [/_next\/static/i, /next\/dist/i],
    html: [/__NEXT_DATA__/, /__next/],
    meta: [/next/i],
  },
  {
    name: "Vue",
    scripts: [/vue(?:\.min)?\.js/i, /vue@/i],
    html: [/data-v-[a-f0-9]/i, /id="app".*?v-/i],
  },
  {
    name: "Angular",
    scripts: [/angular(?:\.min)?\.js/i, /angular\.io/i],
    html: [/ng-version/i, /ng-app/i, /\[ng/i],
  },
  {
    name: "Svelte",
    scripts: [/svelte/i],
    html: [/svelte-[a-z0-9]/i],
  },
  {
    name: "WordPress",
    scripts: [/wp-content/i, /wp-includes/i],
    html: [/wp-content/i, /wp-json/i],
    meta: [/wordpress/i],
  },
  {
    name: "Shopify",
    scripts: [/cdn\.shopify\.com/i],
    html: [/Shopify\.theme/i, /shopify-section/i],
    headers: [{ key: "x-shopify-stage", pattern: /.*/ }],
  },
  {
    name: "Wix",
    scripts: [/static\.wixstatic\.com/i, /wix\.com/i],
    html: [/wix-warmup-data/i, /wixsite/i],
    meta: [/wix\.com/i],
  },
  {
    name: "Squarespace",
    scripts: [/squarespace/i, /static1\.squarespace\.com/i],
    html: [/squarespace/i],
    meta: [/squarespace/i],
  },
  {
    name: "Bootstrap",
    scripts: [/bootstrap(?:\.min)?\.js/i],
    html: [/class="[^"]*\b(?:container|row|col-(?:xs|sm|md|lg|xl))/i],
  },
  {
    name: "Tailwind",
    html: [/class="[^"]*\b(?:flex|grid|bg-|text-|p-|m-|w-|h-)[^"]*"/i],
  },
  {
    name: "jQuery",
    scripts: [/jquery(?:\.min)?\.js/i, /jquery[-.][\d.]+/i],
  },
  {
    name: "Google Analytics",
    scripts: [
      /google-analytics\.com\/analytics\.js/i,
      /googletagmanager\.com\/gtag/i,
      /ga\.js/i,
    ],
    html: [/gtag\(/i, /GoogleAnalyticsObject/i],
  },
  {
    name: "Google Tag Manager",
    scripts: [/googletagmanager\.com\/gtm\.js/i],
    html: [/GTM-[A-Z0-9]+/i],
  },
  {
    name: "HubSpot",
    scripts: [/js\.hs-scripts\.com/i, /hubspot\.com/i],
    html: [/hs-script-loader/i, /hbspt/i],
  },
  {
    name: "Salesforce",
    scripts: [/force\.com/i, /salesforce\.com/i],
    html: [/salesforce/i, /pardot/i],
  },
  {
    name: "Intercom",
    scripts: [/widget\.intercom\.io/i, /intercomcdn\.com/i],
    html: [/intercom-container/i, /Intercom\(/i],
  },
  {
    name: "Stripe",
    scripts: [/js\.stripe\.com/i],
    html: [/stripe-button/i, /Stripe\(/i],
  },
  {
    name: "Drift",
    scripts: [/js\.driftt\.com/i, /drift\.com/i],
    html: [/drift-frame-controller/i],
  },
  {
    name: "Zendesk",
    scripts: [/static\.zdassets\.com/i, /zendesk\.com/i],
    html: [/zE\(/i, /zendesk/i],
  },
  {
    name: "Segment",
    scripts: [/cdn\.segment\.com/i],
    html: [/analytics\.identify/i, /analytics\.track/i],
  },
  {
    name: "Hotjar",
    scripts: [/static\.hotjar\.com/i],
    html: [/hj\(/i, /hotjar/i],
  },
  {
    name: "Cloudflare",
    headers: [
      { key: "server", pattern: /cloudflare/i },
      { key: "cf-ray", pattern: /.*/ },
    ],
  },
  {
    name: "Vercel",
    headers: [{ key: "x-vercel-id", pattern: /.*/ }],
  },
  {
    name: "Netlify",
    headers: [{ key: "x-nf-request-id", pattern: /.*/ }],
  },
];

export function detectTechnologies(
  html: string,
  headers: Record<string, string>
): string[] {
  const detected = new Set<string>();

  for (const tech of TECH_PATTERNS) {
    if (matchesTech(tech, html, headers)) {
      detected.add(tech.name);
    }
  }

  return Array.from(detected).sort();
}

function matchesTech(
  tech: TechPattern,
  html: string,
  headers: Record<string, string>
): boolean {
  if (tech.scripts) {
    for (const pattern of tech.scripts) {
      if (pattern.test(html)) return true;
    }
  }

  if (tech.html) {
    for (const pattern of tech.html) {
      if (pattern.test(html)) return true;
    }
  }

  if (tech.meta) {
    const metaMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      for (const pattern of tech.meta) {
        if (pattern.test(metaMatch[1])) return true;
      }
    }
  }

  if (tech.headers) {
    for (const { key, pattern } of tech.headers) {
      const headerValue = headers[key.toLowerCase()] ?? headers[key];
      if (headerValue && pattern.test(headerValue)) return true;
    }
  }

  return false;
}
