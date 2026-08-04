import React from "react";
import { BsGrid } from "react-icons/bs";
import { MdOutlineFormatListBulleted } from "react-icons/md";

import classNames from "classnames";

import { useTranslation } from "../../contexts/I18n.context";
import { useViewMode } from "../../contexts/ViewMode.context";

import styles from "./BrowserViewToggle.module.scss";

export const BrowserViewToggle: React.FC = () => {
  const { __ } = useTranslation();
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className={styles.wrapper} role="group" aria-label={__("directoryExplorer.viewMode") || "View mode"}>
      <button
        type="button"
        className={classNames(styles.button, { [styles.active]: viewMode === "grid" })}
        onClick={() => setViewMode("grid")}
        aria-pressed={viewMode === "grid"}
        aria-label={__("directoryExplorer.gridView") || "Grid view"}
        title={__("directoryExplorer.gridView") || "Grid view"}
      >
        <BsGrid size={18} />
      </button>

      <button
        type="button"
        className={classNames(styles.button, { [styles.active]: viewMode === "list" })}
        onClick={() => setViewMode("list")}
        aria-pressed={viewMode === "list"}
        aria-label={__("directoryExplorer.listView") || "List view"}
        title={__("directoryExplorer.listView") || "List view"}
      >
        <MdOutlineFormatListBulleted size={20} />
      </button>
    </div>
  );
};
