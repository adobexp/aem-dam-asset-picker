import { FC } from "react";
import { AiTwotoneFolderOpen } from "react-icons/ai";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import classNames from "classnames";

import styles from "../DirectoryTree.module.scss";

type DirectoryLinkProps = {
  path: string;
  name: string;
  expanded: boolean;
  leaf: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

export const DirectoryLink: FC<DirectoryLinkProps> = ({ path, name, expanded, leaf, onExpand, onCollapse }) => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();

  const isActive = decodeURI(pathname) === path;

  const handleClick = (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    expanded ? onCollapse() : onExpand();
  };

  return (
    <div className={styles.directoryLinkWrapper}>
      <Link
        className={classNames(styles.directoryLink, {
          [styles.directoryLinkActive]: isActive,
        })}
        to={{
          pathname: path,
          search: `?${searchParams.toString()}`,
        }}
      >
        {/* Always reserve the chevron column so leaf and non-leaf rows share the same icon gutter. */}
        {leaf ? (
          <span className={styles.expandIcon} aria-hidden="true" />
        ) : (
          <span
            className={styles.expandIcon}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleClick(e);
            }}
          >
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </span>
        )}

        <span className={styles.icon}>
          {expanded ? <AiTwotoneFolderOpen size={18} /> : <FolderIcon fontSize="small" />}
        </span>
        <span className={styles.name}>{name}</span>
      </Link>
    </div>
  );
};
