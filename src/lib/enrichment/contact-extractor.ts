/**
 * Deep contact extraction from HTML content.
 * Pulls emails, phone numbers, physical addresses, and contact page links.
 */

export interface ExtractedContacts {
  emails: string[];
  phones: string[];
  addresses: string[];
  contactPageUrl: string | null;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

const JUNK_EMAIL_PATTERNS = [
  /^noreply@/i,
  /^no-reply@/i,
  /^admin@/i,
  /^webmaster@/i,
  /^support@.*\.(google|facebook|twitter|apple|microsoft)\./i,
  /@example\./i,
  /@sentry\./i,
  /@wixpress\./i,
  /@squarespace\./i,
  /\.png$/i,
  /\.jpg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.webp$/i,
];

const CONTACT_PAGE_PATTERNS = [
  /\/contact/i,
  /\/about/i,
  /\/team/i,
  /\/staff/i,
  /\/people/i,
  /\/get-in-touch/i,
  /\/reach-us/i,
];

export function extractContacts(html: string, links: string[]): ExtractedContacts {
  const emails = extractEmails(html);
  const phones = extractPhones(html);
  const addresses = extractAddresses(html);
  const contactPageUrl = findContactPage(links);

  return { emails, phones, addresses, contactPageUrl };
}

function extractEmails(html: string): string[] {
  // Also check mailto: links for emails hidden in href
  const mailtoMatches = html.match(/mailto:([^"'\s?]+)/gi) ?? [];
  const mailtoEmails = mailtoMatches
    .map(m => m.replace(/^mailto:/i, '').split('?')[0].toLowerCase());

  const bodyMatches = html.match(EMAIL_REGEX) ?? [];
  const bodyEmails = bodyMatches.map(e => e.toLowerCase());

  const allEmails = [...new Set([...mailtoEmails, ...bodyEmails])];

  return allEmails.filter(email => {
    // Filter junk emails
    if (JUNK_EMAIL_PATTERNS.some(p => p.test(email))) return false;
    // Filter emails that look like file references
    if (/\.(png|jpg|gif|svg|css|js)$/i.test(email)) return false;
    return true;
  });
}

function extractPhones(html: string): string[] {
  // Check tel: links first
  const telMatches = html.match(/tel:([^"'\s]+)/gi) ?? [];
  const telPhones = telMatches.map(m => m.replace(/^tel:/i, '').replace(/[^\d+\-().]/g, ''));

  const bodyMatches = html.match(PHONE_REGEX) ?? [];

  const allPhones = [...new Set([...telPhones, ...bodyMatches])]
    .map(p => p.trim())
    .filter(p => {
      // Must have at least 7 digits
      const digits = p.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    });

  return allPhones.slice(0, 5); // Limit to 5 phone numbers
}

function extractAddresses(html: string): string[] {
  const addresses: string[] = [];

  // Look for structured address data (schema.org, microdata)
  const streetMatches = html.match(
    /(?:itemprop|property)=["'](?:streetAddress|address)["'][^>]*>([^<]+)</gi
  );
  if (streetMatches) {
    for (const match of streetMatches) {
      const text = match.replace(/<[^>]+>/g, '').replace(/.*>/, '').trim();
      if (text.length > 5 && text.length < 200) {
        addresses.push(text);
      }
    }
  }

  // Look for common address patterns in text
  const addressRegex =
    /\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Place|Pl|Suite|Ste|Floor|Fl)\.?\s*,?\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi;
  const bodyAddresses = html.replace(/<[^>]+>/g, ' ').match(addressRegex) ?? [];
  for (const addr of bodyAddresses) {
    const clean = addr.replace(/\s+/g, ' ').trim();
    if (!addresses.includes(clean)) {
      addresses.push(clean);
    }
  }

  return addresses.slice(0, 3);
}

function findContactPage(links: string[]): string | null {
  for (const link of links) {
    if (CONTACT_PAGE_PATTERNS.some(p => p.test(link))) {
      return link;
    }
  }
  return null;
}
