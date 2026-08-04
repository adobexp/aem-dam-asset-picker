import { FC, useEffect, useRef } from "react";

import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { DirectoryStructure } from "../../models/directoryStructure";

import { Breadcrumb } from "./Breadcrumb";
import { CollapsedBreadcrumbs } from "./CollapsedBreadcrumbs";

import styles from "./Breadcrumbs.module.scss";

type BreadcrumbsProps = {
  directoryStructure: DirectoryStructure;
};

const MAX_START_COUNT = 1;
const MAX_END_COUNT = 2;

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ directoryStructure }) => {
  const breadcrumbs = useBreadcrumbs(directoryStructure);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollLeft = scrollableRef.current.scrollWidth;
    }
  }, [breadcrumbs]);

  if (breadcrumbs.length < 1) return null;

  const startCount = Math.min(MAX_START_COUNT, breadcrumbs.length);
  const hiddenCount = Math.max(breadcrumbs.length - MAX_START_COUNT - MAX_END_COUNT, 0);
  const endCount = Math.min(breadcrumbs.length - MAX_START_COUNT, MAX_END_COUNT);

  const startBreadcrumbs = breadcrumbs.slice(0, startCount);
  const hiddenBreadcrumbs = breadcrumbs.slice(startCount, startCount + hiddenCount);
  const endBreadcrumbs = breadcrumbs.slice(startCount + hiddenCount, startCount + hiddenCount + endCount);
  const showHiddenBreadcrumbs = breadcrumbs.length > startBreadcrumbs.length + endBreadcrumbs.length;

  return (
    <div className={styles.breadcrumbs} ref={scrollableRef}>
      <ul className={styles.list}>
        {startBreadcrumbs.map(({ path, segment }, index) => {
          const decodedPath = decodeURI(path);
          const globalIndex = index;
          return (
            <Breadcrumb
              label={directoryStructure?.[decodedPath]?.data?.name || " - "}
              path={path}
              segment={segment}
              key={index}
              isLast={globalIndex === breadcrumbs.length - 1}
            />
          );
        })}
        {showHiddenBreadcrumbs ? (
          <CollapsedBreadcrumbs breadcrumbs={hiddenBreadcrumbs} directoryStructure={directoryStructure} />
        ) : null}
        {endBreadcrumbs.map(({ path, segment }, index) => {
          const decodedPath = decodeURI(path);
          const globalIndex = startCount + hiddenCount + index;
          return (
            <Breadcrumb
              label={directoryStructure?.[decodedPath]?.data?.name || " - "}
              path={path}
              segment={segment}
              key={index}
              isLast={globalIndex === breadcrumbs.length - 1}
            />
          );
        })}
      </ul>
    </div>
  );
};
