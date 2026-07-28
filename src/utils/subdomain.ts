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
    return params.get('subdomain') || null;
  }

  // Split hostname by dots
  const parts = hostname.split('.');
  
  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // If we have exactly 2 parts (domain.tld), no subdomain
  return null;
}
