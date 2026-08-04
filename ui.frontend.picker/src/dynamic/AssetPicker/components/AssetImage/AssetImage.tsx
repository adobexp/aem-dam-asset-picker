import React, { useEffect, useState } from "react";

import { isWebpAsset, toBrowserUrl } from "../../utils/imageUrl";

export interface AssetImageProps {
  /** Primary image URL (usually DAM thumbnail / card rendition). */
  src?: string | null;
  /** Fallback when primary fails — typically the original asset path (esp. WebP). */
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  /** Asset name or path — used to prefer original for WebP. */
  name?: string;
  mime?: string;
}

/**
 * Image that falls back to the original asset URL when the thumbnail/rendition
 * fails to load. Critical for WebP on environments where DAM thumbs are missing.
 */
export const AssetImage: React.FC<AssetImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className,
  style,
  draggable = false,
  name,
  mime,
}) => {
  const primary = toBrowserUrl(src);
  const fallback = toBrowserUrl(fallbackSrc);
  const webp = isWebpAsset(name || fallbackSrc || src || undefined, mime);

  // WebP: start with original when available (lightweight + reliable).
  const initial = webp && fallback ? fallback : primary || fallback;
  const [current, setCurrent] = useState<string | undefined>(initial);

  useEffect(() => {
    setCurrent(webp && fallback ? fallback : primary || fallback);
  }, [primary, fallback, webp]);

  if (!current) {
    return null;
  }

  return React.createElement("img", {
    src: current,
    alt,
    className,
    style,
    draggable,
    onError: () => {
      if (fallback && current !== fallback) {
        setCurrent(fallback);
      }
    },
  });
};
