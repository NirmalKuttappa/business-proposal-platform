const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous chars

/** Generates a random URL-safe slug for a public proposal page. */
export function generateSlug(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
