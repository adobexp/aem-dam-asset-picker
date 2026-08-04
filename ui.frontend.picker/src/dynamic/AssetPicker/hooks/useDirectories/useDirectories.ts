import { useState } from "react";

import { useConfiguration } from "../../contexts/Configuration.context";
import { Directory } from "../../models/api";
import {
  AssetData,
  AssetItem,
  DirectoryData,
  DirectoryItem,
  DirectoryStructure,
} from "../../models/directoryStructure";
import { SortOrder } from "../../models/sort";
import { Stats } from "../../models/stats";
import { assetsUrl, fetchJson } from "../../utils/apiClient";
import { isDirectory } from "../../utils/isDirectory";
import { mapAsset } from "../../utils/mapAsset";
import { mapDirectory } from "../../utils/mapDirectory";

type UseDirectoriesProps = {
  setDirectoryStats: (directoryStats: Stats) => void;
};

const getLevel = (cachedDirectory: AssetItem | DirectoryItem | null): number => {
  if (isDirectory(cachedDirectory)) {
    return cachedDirectory.data?.level || 0;
  }
  return 0;
};

export const useDirectories = ({ setDirectoryStats }: UseDirectoriesProps) => {
  const { apiBase, collections, rootLabel, rootDirectories, pickerParams } = useConfiguration();
  const [directoryStructure, setDirectoryStructure] = useState<DirectoryStructure>({});

  const fetchDirectory = async (directoryPath: string, sort?: { sortId: string; sortOrder: SortOrder }) => {
    setDirectoryStructure((prev) => ({
      ...prev,
      [directoryPath]: {
        ...prev[directoryPath],
        loading: true,
        error: false,
      },
    }));

    const realPath = directoryPath.split("|").at(-1) || directoryPath;
    const requestUrl = assetsUrl(apiBase, realPath, sort ?? {}, pickerParams ?? {});

    try {
      const responseJson = await fetchJson<Directory | Directory[]>(requestUrl);
      if (Array.isArray(responseJson) && responseJson.length === 0) {
        throw new Error("Empty response");
      }
      const fetchedDirectory = Array.isArray(responseJson)
        ? (responseJson[0] as Directory)
        : (responseJson as Directory);
      const { time, total, displayed } = fetchedDirectory;
      setDirectoryStats({ total, displayed, time });

      setDirectoryStructure((prev) => {
        const cachedDirectory = prev[decodeURI(directoryPath)];
        const newDirectoryStructure = { ...prev };
        const level = getLevel(cachedDirectory);
        const childrenCount =
          cachedDirectory?.data && "childrenCount" in cachedDirectory.data
            ? cachedDirectory.data.childrenCount
            : undefined;
        const isParent = !collections && fetchedDirectory.path === rootDirectories[0];

        const name = isParent ? rootLabel : cachedDirectory ? cachedDirectory.data?.name : "";

        const childPaths = fetchedDirectory.items.map(({ path, sequenceOrder }) => {
          const basePath = collections ? `${directoryPath}|${path}` : path;
          return {
            path: basePath,
            ...(sequenceOrder !== undefined && { sequenceOrder }),
          };
        });

        // A folder that just returned children cannot stay marked as a leaf — otherwise
        // the chevron column is omitted and sibling icons no longer share a gutter.
        const hasDirectoryChildren = fetchedDirectory.items.some((item) => item.type !== "asset");
        const leaf = isParent ? false : !hasDirectoryChildren;

        if (collections) {
          fetchedDirectory.path = directoryPath;
        }
        newDirectoryStructure[directoryPath] = mapDirectory(
          fetchedDirectory,
          {
            name,
            leaf,
            expanded: true,
            level,
            childPaths,
            thumbnail: cachedDirectory?.data?.thumbnail,
            childrenCount,
          },
          sort,
        );

        fetchedDirectory.items.forEach((item) => {
          const path = collections ? `${directoryPath}|${item.path}` : item.path;

          newDirectoryStructure[path] =
            item.type === "asset"
              ? mapAsset({ ...item, path })
              : mapDirectory(
                  { ...item, path },
                  {
                    name: item.name,
                    leaf: item.isLeaf,
                    level: level + 1,
                    childrenCount: item.childrenCount,
                  },
                );
        });
        return newDirectoryStructure;
      });
    } catch {
      setDirectoryStructure((prevDirectoryStructure) => {
        const directoryStructure = { ...prevDirectoryStructure };
        const item = prevDirectoryStructure[directoryPath];

        if (!item?.data || isDirectory(item)) {
          const data: Partial<DirectoryData | AssetData> = item?.data ?? {};
          const level = "level" in data && data.level !== undefined ? data.level : 0;

          directoryStructure[directoryPath] = {
            loading: false,
            error: true,
            data: {
              path: directoryPath,
              type: "directory",
              name: item?.data?.name ?? "Failed to load",
              expanded: false,
              leaf: true,
              level,
              childPaths: [],
            },
          };
        }

        return directoryStructure;
      });
    }
  };

  return {
    directoryStructure,
    setDirectoryStructure,
    fetchDirectory,
  };
};
