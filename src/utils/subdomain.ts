/**
 * Extracts the subdomain from the current window location.
 * Example: "store.kromic.in" -> "store"
 * Example: "www.kromic.in" -> "www"
 * Example: "kromic.in" -> null
 */
export function extractSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  
  // Handle localhost/IP testing fallbacks
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If testing subdomains locally via query param or header (e.g. ?tenant=store)
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subdomain');
    if (sub === 'www' || sub === 'store') return null;
    return sub || null;
  }

  // Split hostname by dots
  const parts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub === 'www' || sub === 'store') return null;
    return sub;
  }
  
  // If we have exactly 2 parts (domain.tld), no subdomain
  return null;
}
