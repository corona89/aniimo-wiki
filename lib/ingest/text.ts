// Minimal HTML/XML → plain-text helpers shared by the community fetchers.
// The upstream pages are server-rendered and stable; these small helpers
// avoid pulling in a DOM dependency.

/** Decode common HTML entities (&amp; last so double-escapes stay intact). */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function safeCodePoint(code: number): string {
  try {
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  } catch {
    return "";
  }
}

/** Strip all tags (replaced with a space so words don't fuse). */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ");
}

/** Tags stripped, entities decoded, whitespace collapsed, trimmed. */
export function htmlToText(input: string): string {
  return decodeEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}
