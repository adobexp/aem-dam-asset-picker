import { FC, PropsWithChildren } from "react";

import classNames from "classnames";

import styles from "./Collapsible.module.scss";

type CollapsibleProps = {
  id: string;
  title: string;
  collapsed: boolean;
  onSetCollapsed: (collapsed: boolean) => void;
  /** Optional small text shown next to the title (e.g. "(1 selected)") */
  badge?: string;
};

export const Collapsible: FC<PropsWithChildren<CollapsibleProps>> = ({
  id,
  title,
  children,
  collapsed,
  onSetCollapsed,
  badge,
}) => {
  const handleToggleClick = (): void => {
    onSetCollapsed(!collapsed);
  };

  return (
    <div
      className={classNames(styles.root, {
        [styles.expanded]: !collapsed,
      })}
    >
      <button
        className={styles.toggleButton}
        type="button"
        aria-controls={id}
        aria-expanded={!collapsed}
        onClick={handleToggleClick}
      >
        <span className={styles.titleWrap}>
          <span className={styles.title}>{title}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </span>

        {/* Chevron down — rotates to chevron up when expanded */}
        <svg className={styles.icon} width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      <div className={styles.content} id={id} role="region" tabIndex={-1} aria-hidden={collapsed}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
};
