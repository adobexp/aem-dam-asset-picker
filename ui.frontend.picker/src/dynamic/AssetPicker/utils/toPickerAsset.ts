import { AssetData } from "../models/directoryStructure";
import { PickerAsset } from "../models/picker";

const findMetadataValue = (asset: AssetData, label: string): string | undefined => {
  if (!Array.isArray(asset.metadata)) {
    return undefined;
  }
  const target = label.toLowerCase();
  return asset.metadata.find((entry) => entry.label?.toLowerCase() === target)?.value;
};

/**
 * Projects an asset onto the payload shape the host page expects. `url` falls back to the
 * JCR path so a consumer always has something addressable even if the API omitted it.
 */
export const toPickerAsset = (asset: AssetData): PickerAsset => ({
  path: asset.realPath,
  url: asset.url || asset.realPath,
  type: asset.mime,
  title: asset.title || findMetadataValue(asset, "title") || asset.name,
  size: asset.size,
  img: asset.thumbnail?.url,
});
