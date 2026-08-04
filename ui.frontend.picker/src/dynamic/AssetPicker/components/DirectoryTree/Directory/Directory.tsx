import { CSSProperties, FC } from "react";

import { useConfiguration } from "../../../contexts/Configuration.context";
import { DirectoryStructure } from "../../../models/directoryStructure";
import { isDirectory } from "../../../utils/isDirectory";
import { removePrefix } from "../../../utils/removePrefix";
import { Loader } from "../../Loader";
import { DirectoryLink } from "../DirectoryLink";

import styles from "../DirectoryTree.module.scss";

type DirectoryProps = {
  path: string;
  parentPath: string;
  directoryStructure: DirectoryStructure;
  onExpandDirectory: (path: string) => void;
  onCollapseDirectory: (path: string) => void;
};

export const Directory: FC<DirectoryProps> = ({
  path,
  parentPath,
  directoryStructure,
  onExpandDirectory,
  onCollapseDirectory,
}) => {
  const { displayDirectoryNames, rootLabel } = useConfiguration();
  const directory = directoryStructure[path];

  if (!isDirectory(directory)) {
    return null;
  }

  const { data, loading } = directory;

  if (!data) {
    return null;
  }

  const { level, leaf, expanded, childPaths = [] } = data;
  const relativePath = removePrefix(path, parentPath);
  const pathWithoutPrefix = removePrefix(relativePath, "/");
  const displayedPath = rootLabel && pathWithoutPrefix === "" ? rootLabel : pathWithoutPrefix;

  const subdirectoriesPaths = childPaths
    .filter(() => !(loading || data?.type !== "directory"))
    .sort((a, b) => {
      if (a.sequenceOrder !== undefined && b.sequenceOrder !== undefined) {
        return a.sequenceOrder - b.sequenceOrder;
      }
      if (a.sequenceOrder !== undefined) return -1;
      if (b.sequenceOrder !== undefined) return 1;
      return a.path.localeCompare(b.path);
    });

  const getDisplayedName = () => {
    const directoryName = directoryStructure[path].data?.name || "";
    if (displayDirectoryNames && directoryName) {
      return directoryName;
    }
    return displayedPath;
  };

  return (
    <div className={styles.directory} style={{ "--directory-level": level } as CSSProperties}>
      <DirectoryLink
        path={path}
        name={getDisplayedName()}
        expanded={expanded}
        leaf={leaf}
        onCollapse={() => onCollapseDirectory(path)}
        onExpand={() => onExpandDirectory(path)}
      />
      {loading && (
        <div className={styles.directoryLoader}>
          <Loader />
        </div>
      )}
      {!loading && expanded && subdirectoriesPaths.length > 0 && (
        <div className={styles.subdirectories}>
          {subdirectoriesPaths.map((subdirectoryPath) => {
            return (
              <Directory
                key={subdirectoryPath.path}
                path={subdirectoryPath.path}
                parentPath={path}
                directoryStructure={directoryStructure}
                onCollapseDirectory={onCollapseDirectory}
                onExpandDirectory={onExpandDirectory}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
