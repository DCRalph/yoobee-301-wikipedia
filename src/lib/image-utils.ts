/**
 * Decodes a wiki URL by replacing occurrences of "///" with "_"
 * to match the Svelte implementation.
 *
 * @param url Original URL string.
 * @returns Decoded URL string.
 */
function decodeWikiUrl(url: string): string {
  if (!url) return url;
  return url.replace(/\/\/\//g, "_");
}

/**
 * Transforms a wiki image URL specifically for Wikimedia URLs.
 * It returns an object containing both a primary URL and a fallback URL.
 *
 * The logic mirrors the Svelte code:
 *   1. If no URL is provided, it returns the URL with a null fallback.
 *   2. If the URL doesn’t start with "https://", it prepends it.
 *   3. It decodes the URL using the same method as in Svelte.
 *   4. If the URL is recognized as a Wikimedia URL,
 *      it constructs the primary and fallback URLs based on path parts.
 *   5. Otherwise, it returns the URL with a null fallback.
 *
 * @param url Original image URL.
 * @returns Object containing primary and optional fallback URLs.
 */
export async function transformWikiImageUrl(
  url: string
): Promise<{ primary: string; fallback: string | null }> {
  if (!url) return { primary: url, fallback: null };

  // Prepend https:// if missing
  url = !url.startsWith("https://") ? `https://${url}` : url;

  // Use the same decode as the Svelte version
  url = decodeWikiUrl(url);

  if (url.includes("wikimedia.org/wikipedia/")) {
    const parts = url.split("/");
    const wikiIndex = parts.findIndex((p) => p === "wikipedia");

    // Extract the parts following the wikipedia segment
    const type = parts[wikiIndex + 1];
    const hash = parts[wikiIndex + 2];
    const subHash = parts[wikiIndex + 3];
    const filename = parts[parts.length - 1];
    const pathPrefix = parts.slice(0, wikiIndex + 1).join("/");

    const makeUrl = (t: string) => {
      const suffix = filename?.toLowerCase().endsWith(".svg") ? ".png" : "";
      return `${pathPrefix}/${t}/thumb/${hash}/${subHash}/${filename}/330px-${filename}${suffix}`;
    };

    return {
      primary: makeUrl(type ?? ""),
      fallback: type === "commons" ? makeUrl("en") : makeUrl("commons")
    };
  }

  // For non-Wikimedia URLs, return the URL with a null fallback.
  return { primary: url, fallback: null };
}