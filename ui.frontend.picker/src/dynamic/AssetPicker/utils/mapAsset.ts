import { Asset } from "../models/api";
import { AssetItem } from "../models/directoryStructure";

export const mapAsset = (asset: Asset): AssetItem => {
  const {
    type,
    path,
    name,
    mime,
    resolution,
    size,
    detailsUrl,
    thumbnail,
    originalDownloadUrl,
    renditionDownloadUrl,
    downloadEnabled,
    shareEnabled,
    cartEnabled,
    metadata,
    url,
    title,
  } = asset as Asset & { url?: string; title?: string };

  const width = resolution?.width || 0;
  const height = resolution?.height || 0;
  const dpi = resolution?.dpi || 0;
  const dimensions =
    resolution?.dimensions || (width > 0 && height > 0 ? `${width} x ${height}` : "");

  return {
    loading: false,
    data: {
      type: type || "asset",
      path,
      realPath: path.split("|").at(-1) || "",
      name,
      mime,
      resolution: { width, height, dpi, dimensions },
      size,
      url: url || path.split("|").at(-1) || path,
      title: title || name,
      detailsUrl,
      thumbnail,
      originalDownloadUrl,
      renditionDownloadUrl,
      downloadEnabled,
      shareEnabled,
      cartEnabled,
      metadata,
    },
  };
};
