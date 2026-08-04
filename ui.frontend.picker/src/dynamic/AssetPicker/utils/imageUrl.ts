/** Encode spaces / unsafe chars without double-encoding existing %XX sequences. */
export const toBrowserUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return encodeURI(url);
  }
};

export const isWebpAsset = (nameOrPath?: string, mime?: string): boolean => {
  const mimeLower = (mime || "").toLowerCase();
  if (mimeLower === "image/webp" || mimeLower.includes("webp")) return true;
  return /\.webp($|\?|#)/i.test(nameOrPath || "");
};

/**
 * Best display src for an asset image.
 * WebP originals are browser-native and lightweight — prefer them when no
 * thumbnail URL is provided (or as the onError fallback).
 */
export const resolveAssetImageSrc = (
  thumbnailUrl?: string | null,
  originalPath?: string | null,
  options?: { preferOriginalForWebp?: boolean; name?: string; mime?: string },
): string | undefined => {
  const thumb = toBrowserUrl(thumbnailUrl);
  const original = toBrowserUrl(originalPath);
  const preferOriginal =
    options?.preferOriginalForWebp !== false && isWebpAsset(options?.name || originalPath, options?.mime);

  if (preferOriginal) {
    return original || thumb;
  }
  return thumb || original;
};
