import { FC } from "react";

import { useConfiguration } from "../../contexts/Configuration.context";
import { DirectoryStructure } from "../../models/directoryStructure";

import { Directory } from "./Directory";

import styles from "./DirectoryTree.module.scss";

type DirectoryTreeProps = {
  directoryStructure: DirectoryStructure;
  onExpandDirectory: (path: string) => void;
  onCollapseDirectory: (path: string) => void;
};

export const DirectoryTree: FC<DirectoryTreeProps> = ({
  directoryStructure,
  onExpandDirectory,
  onCollapseDirectory,
}) => {
  const { rootDirectories } = useConfiguration();

  return (
    <div className={styles.directoryTree}>
      <div className={styles.wrapper}>
        {rootDirectories.map((directory) => (
          <Directory
            key={directory}
            path={directory}
            parentPath={directory}
            directoryStructure={directoryStructure}
            onExpandDirectory={onExpandDirectory}
            onCollapseDirectory={onCollapseDirectory}
          />
        ))}
      </div>
    </div>
  );
};
