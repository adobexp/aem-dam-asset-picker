import { AssetItem, DirectoryItem } from "../models/directoryStructure";

export const isDirectory = (asset: AssetItem | DirectoryItem | null): asset is DirectoryItem => {
  if (asset == null) return false;
  return asset.data?.type === "directory";
};
