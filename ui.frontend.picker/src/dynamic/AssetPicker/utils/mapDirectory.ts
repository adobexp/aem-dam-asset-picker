import { Directory } from "../models/api";
import { DirectoryItem } from "../models/directoryStructure";
import { SortOrder } from "../models/sort";

export const mapDirectory = (
  directory: Directory,
  defaults: Partial<DirectoryItem["data"]> = {},
  sort?: { sortOrder: SortOrder; sortId: string },
): DirectoryItem => {
  const { name, level = 0, childPaths = [], expanded = false, leaf = true, thumbnail, childrenCount } = defaults;

  return {
    loading: false,
    data: {
      type: "directory",
      path: directory.path,
      name: directory.name || name || "",
      thumbnail: directory.thumbnail || thumbnail,
      leaf,
      level,
      expanded,
      childPaths,
      childrenCount,
      ...sort,
    },
  };
};
