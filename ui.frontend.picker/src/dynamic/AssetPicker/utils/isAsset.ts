import { AssetItem, DirectoryItem } from "../models/directoryStructure";

export const isAsset = (asset: AssetItem | DirectoryItem | null): asset is AssetItem => {
  if (asset === null) return false;
  return asset.data?.type === "asset";
};
