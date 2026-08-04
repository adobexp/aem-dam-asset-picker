import { FC } from "react";

import { checkElementOverflow } from "../../../utils/checkElementOverflow";

import styles from "../Breadcrumbs.module.scss";

type BreadcrumbProps = {
  label: string;
  path: string;
  segment: string;
  isLast: boolean;
};

export const Breadcrumb: FC<BreadcrumbProps> = ({ label, path, isLast }) => {
  const onRef = <T extends HTMLElement>(node: T, title: string) => {
    if (!node) {
      return;
    }

    const isOverflowing = checkElementOverflow(node);

    if (isOverflowing) {
      node.setAttribute("title", title);
    } else {
      node.removeAttribute("title");
    }
  };

  return (
    <li className={styles.item}>
      <span className={styles.linkWrapper}>
        {isLast ? (
          <span className={styles.link} ref={(ref: HTMLSpanElement) => onRef(ref, label)}>
            {label}
          </span>
        ) : (
          <a href={`#${path}`} className={styles.link} ref={(ref: HTMLAnchorElement) => onRef(ref, label)}>
            {label}
          </a>
        )}
      </span>
    </li>
  );
};
