import { useLocation } from "react-router-dom";

import { DirectoryItem, DirectoryStructure } from "../../models/directoryStructure";
import { isDirectory } from "../../utils/isDirectory";

export const useCurrentDirectory = (directoryStructure: DirectoryStructure): DirectoryItem | null => {
  const { pathname } = useLocation();
  const path = decodeURI(pathname);
  const asset = directoryStructure[path];

  if (!asset) return null;

  return isDirectory(asset) ? asset : null;
};
