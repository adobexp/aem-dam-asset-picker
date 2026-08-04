import { FC } from "react";

import classNames from "classnames";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";

import styles from "./StatsPanel.module.scss";

type StatsPanelVariant = "default" | "compact";

type StatsPanelProps = {
  stats: {
    total: number;
    displayed: number;
    time: number;
  };
  variant?: StatsPanelVariant;
};

export const StatsPanel: FC<StatsPanelProps> = ({ stats, variant = "default" }) => {
  const { __ } = useTranslation();
  const { hideMilliSeconds } = useConfiguration();

  const formatCount = (n: number) => (n >= 100 ? `${n}+` : `${n}`);

  return (
    <div
      className={classNames(styles.statsContainer, {
        [styles.statsContainerCompact]: variant === "compact",
      })}
      aria-live="polite"
    >
      <div className={styles.statItem}>
        <div className={styles.value}>{formatCount(stats.displayed)}</div>
        <div className={styles.label}>{__("directoryExplorer.displayed")}</div>
      </div>

      <div className={styles.statItem}>
        <div className={styles.value}>{formatCount(stats.total)}</div>
        <div className={styles.label}>{__("directoryExplorer.total")}</div>
      </div>

      {!hideMilliSeconds && (
        <div className={styles.statItem}>
          <div className={styles.value}>{stats.time}</div>
          <div className={styles.label}>{__("directoryExplorer.time")}</div>
        </div>
      )}
    </div>
  );
};
