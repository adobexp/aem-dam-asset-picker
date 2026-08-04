import { FC, PropsWithChildren } from "react";
import { AiTwotoneFolderOpen } from "react-icons/ai";
import { Link } from "react-router-dom";

import classNames from "classnames";

import styles from "./DirectoryCard.module.scss";

type DirectoryProps = {
  path: string;
  thumbnail?: { url: string };
  childrenCount?: number;
};

export const DirectoryCard: FC<PropsWithChildren<DirectoryProps>> = ({
  path,
  children,
  thumbnail,
  childrenCount = 0,
}) => {
  return (
    <Link
      to={{
        pathname: path,
      }}
      className={styles.card}
    >
      <div
        className={classNames(styles.iconWrapper, {
          [styles.withThumbnail]: Boolean(thumbnail?.url),
        })}
        style={
          thumbnail?.url
            ? ({ "--background": `url("${thumbnail.url}")` } as React.CSSProperties)
            : undefined
        }
      >
        <AiTwotoneFolderOpen size="60" className={styles.icon} />
        <div className={styles.nameWrapper}>
          <span className={styles.name}>{children}</span>
          <span className={styles.count}>{`${childrenCount} items`}</span>
        </div>
      </div>
    </Link>
  );
};
