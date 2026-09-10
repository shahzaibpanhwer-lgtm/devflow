/**
 * Slug helpers.
 *
 * Slugs are public — they appear in /p/[slug] — so they are generated from the
 * project name rather than accepted verbatim from user input.
 */

const MAX_SLUG_LENGTH = 60;

/**
 * Letters carrying a conventional multi-letter transliteration.
 *
 * Unicode normalisation cannot decompose these: NFKD leaves "ß" intact, so
 * "Größe" would otherwise slugify to "gro-e". Written as escape sequences so
 * the mapping survives any tooling that mishandles non-ASCII source.
 */
const TRANSLITERATIONS: Record<string, string> = {
  ß: "ss", // ß
  æ: "ae", // æ
  Æ: "ae", // Æ
  œ: "oe", // œ
  Œ: "oe", // Œ
  ø: "o", // ø
  Ø: "o", // Ø
  đ: "d", // đ
  Đ: "d", // Đ
  ł: "l", // ł
  Ł: "l", // Ł
  þ: "th", // þ
  Þ: "th", // Þ
  ð: "d", // ð
  Ð: "d", // Ð
};

const TRANSLITERATION_PATTERN = new RegExp(`[${Object.keys(TRANSLITERATIONS).join("")}]`, "g");

export function slugify(input: string): string {
  return (
    input
      .replace(TRANSLITERATION_PATTERN, (char) => TRANSLITERATIONS[char] ?? char)
      .normalize("NFKD")
      // Strip the combining marks NFKD just separated out, so "Café" becomes
      // "cafe" rather than "caf".
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_SLUG_LENGTH)
      .replace(/-+$/g, "")
  );
}

/**
 * Words that would collide with real routes if used as a slug.
 */
const RESERVED = new Set([
  "api",
  "dashboard",
  "login",
  "register",
  "settings",
  "new",
  "admin",
  "p",
  "dev",
  "_next",
]);

/**
 * Finds a slug that is not already taken.
 *
 * `isTaken` is injected so this stays free of database imports and can be
 * unit-tested directly.
 */
export async function uniqueSlug(
  name: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "project";
  const seed = RESERVED.has(base) ? `${base}-project` : base;

  if (!(await isTaken(seed))) {
    return seed;
  }

  // Suffix until free. Bounded so a pathological case cannot loop forever.
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${seed.slice(0, MAX_SLUG_LENGTH - 5)}-${suffix}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `${seed.slice(0, MAX_SLUG_LENGTH - 12)}-${Date.now().toString(36)}`;
}
