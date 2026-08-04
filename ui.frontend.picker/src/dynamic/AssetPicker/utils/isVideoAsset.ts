const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|ogv)($|\?|#)/i;

/**
 * Detect video assets from DAM mime / display type / filename.
 * Some DAM catalogues expose video as a generic "Multimedia" mime — confirm via extension.
 */
export const isVideoAsset = (nameOrPath?: string | null, mime?: string | null): boolean => {
  const type = (mime || "").toLowerCase();
  if (type.includes("video") || type.includes("mp4") || type.includes("webm") || type.includes("mov")) {
    return true;
  }
  // Generic "Multimedia" mime — confirm via file extension before treating as video.
  if (type.includes("multimedia") && VIDEO_EXT.test(nameOrPath || "")) {
    return true;
  }
  return VIDEO_EXT.test(nameOrPath || "");
};
