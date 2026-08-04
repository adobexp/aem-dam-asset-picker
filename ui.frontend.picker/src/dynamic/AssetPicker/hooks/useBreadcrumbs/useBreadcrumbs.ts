import { useLocation } from "react-router-dom";

import { useConfiguration } from "../../contexts/Configuration.context";
import { DirectoryStructure } from "../../models/directoryStructure";
import { removePrefix } from "../../utils/removePrefix";

export type Breadcrumb = {
  path: string;
  segment: string;
};

export const getBreadcrumbs = (path: string, rootDirectory: string) => {
  return path
    .split("/")
    .filter(Boolean)
    .reduce(
      (segments, segment) => {
        const previous = segments[segments.length - 1].path;
        segments.push({
          path: `${previous}/${segment}`,
          segment,
        });
        return segments;
      },
      [{ path: `${rootDirectory}`, segment: "/" }],
    );
};

export const useBreadcrumbs = (directoryStructure: DirectoryStructure): Breadcrumb[] => {
  const location = useLocation();
  const path = location.pathname;
  const { collections, rootDirectories } = useConfiguration();

  if (collections) {
    const paths = path.split("|");

    return paths.reduce<Breadcrumb[]>((acc, path) => {
      const accumulatedPath = acc.length ? `${acc.at(-1)?.path}|${path}` : path;

      acc.push({
        path: accumulatedPath,
        segment: directoryStructure[accumulatedPath]?.data?.name || "",
      });
      return acc;
    }, []);
  }

  if (rootDirectories.length === 0) {
    return [];
  }

  const rootDirectory = rootDirectories[0];
  const pathWithoutPrefix = removePrefix(path, rootDirectory);
  const breadcrumbs = getBreadcrumbs(pathWithoutPrefix, rootDirectory);

  return breadcrumbs;
};
