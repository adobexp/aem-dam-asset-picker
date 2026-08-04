import { FC, RefObject } from "react";

import { Breadcrumb as BreadcrumbType } from "../../../hooks/useBreadcrumbs";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { DirectoryStructure } from "../../../models/directoryStructure";
import { Breadcrumb } from "../Breadcrumb";

import styles from "../Breadcrumbs.module.scss";

type BreadcrumbsListProps = {
  breadcrumbs: BreadcrumbType[];
  directoryStructure: DirectoryStructure;
  toggleRef: RefObject<HTMLButtonElement>;
  collapse: () => void;
};

export const BreadcrumbsList: FC<BreadcrumbsListProps> = ({ breadcrumbs, directoryStructure, toggleRef, collapse }) => {
  const clickOutsideRef = useOutsideClick(collapse);

  if (!toggleRef.current) {
    return null;
  }

  const { left, bottom } = toggleRef.current.getBoundingClientRect();

  return (
    <div
      ref={clickOutsideRef}
      onClick={collapse}
      className={styles.collapsedWrapper}
      style={{
        top: `${window.scrollY + bottom + 12}px`,
        left: `${left}px`,
      }}
    >
      <ul className={styles.collapsedList}>
        {breadcrumbs.map(({ path, segment }, index) => {
          const decodedPath = decodeURI(path);
          const directoryData = directoryStructure?.[decodedPath]?.data;
          const label = directoryData?.name || directoryData?.path || "";

          return (
            <Breadcrumb label={label} path={path} segment={segment} key={index} isLast={false} />
          );
        })}
      </ul>
    </div>
  );
};
