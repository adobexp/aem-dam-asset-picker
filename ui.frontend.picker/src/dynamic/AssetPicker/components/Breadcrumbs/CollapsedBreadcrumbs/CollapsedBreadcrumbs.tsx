import { FC, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

import classNames from "classnames";

import { Breadcrumb } from "../../../hooks/useBreadcrumbs";
import { DirectoryStructure } from "../../../models/directoryStructure";
import { BreadcrumbsList } from "../BreadcrumbsList/BreadcrumbsList";

import styles from "../Breadcrumbs.module.scss";

type CollapsedBreadcrumbsProps = {
  breadcrumbs: Breadcrumb[];
  directoryStructure: DirectoryStructure;
};

export const CollapsedBreadcrumbs: FC<CollapsedBreadcrumbsProps> = ({ breadcrumbs, directoryStructure }) => {
  const [showList, setShowList] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleCollapsedBreadcrumbs = () => {
    setShowList((showList) => !showList);
  };

  const collapse = useCallback(() => {
    setShowList(false);
  }, [setShowList]);

  return (
    <li className={styles.item}>
      <span className={styles.linkWrapper}>
        <button
          ref={buttonRef}
          onClick={(ev) => {
            ev.stopPropagation();
            toggleCollapsedBreadcrumbs();
          }}
          type="button"
          className={classNames(styles.link, styles.collapsedLink)}
        >
          …
        </button>
        {showList &&
          createPortal(
            <BreadcrumbsList
              directoryStructure={directoryStructure}
              breadcrumbs={breadcrumbs}
              toggleRef={buttonRef}
              collapse={collapse}
            />,
            document.body,
          )}
      </span>
    </li>
  );
};
