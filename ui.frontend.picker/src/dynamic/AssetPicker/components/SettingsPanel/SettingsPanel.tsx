import { FC, MouseEvent, PropsWithChildren } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BsCardImage } from "react-icons/bs";

import classNames from "classnames";

import ExpandIcon from "../../../../assets/images/expandIcon.svg";
import { useCardView } from "../../contexts/CardView.context";
import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useSelection } from "../../contexts/Selection.context";
import { useSort } from "../../contexts/Sort.context";
import { DirectoryStructure } from "../../models/directoryStructure";
import { Filter as FilterModel } from "../../models/filter";
import { SearchParams, SearchScope } from "../../models/search";
import { Stats } from "../../models/stats";
import { Button } from "../Button";
import { Search } from "../Search";
import { Sort } from "../Sort";
import { BrowserViewToggle } from "../ViewToggle";

import styles from "./SettingsPanel.module.scss";

type ResultTab = "all" | "files" | "folders";

type SettingsPanelProps = {
  directoryStructure: DirectoryStructure;
  isNavigationOpen: boolean;
  toggleNavigation: () => void;
  toggleSearch: () => void;
  filters: FilterModel[] | null;
  searchScope: SearchScope;
  tempSearchScope: SearchScope;
  onTempSearchScope: (scope: SearchScope) => void;
  searchPhrase: string;
  onSearch: (params: SearchParams) => void;
  tempSearchPhrase: string;
  onTempSearch: (phrase: string) => void;
  setSearchStats: (searchStats: Stats) => void;
  semanticSearchEnabled: boolean;
  tempSemanticSearchEnabled: boolean;
  onSemanticSearchToggle: (value: boolean) => void;
  fuzzySearchEnabled: boolean;
  tempFuzzySearchEnabled: boolean;
  onFuzzySearchToggle: (value: boolean) => void;
  showResultTabs?: boolean;
  activeResultTab?: ResultTab;
  resultCounts?: { all: number; files: number; folders: number };
  onChangeResultTab?: (tab: ResultTab) => void;
  totalAssetCount?: number;
  showExpandSidebar?: boolean;
  onExpandSidebar?: () => void;
};

export const SettingsPanel: FC<PropsWithChildren<SettingsPanelProps>> = ({
  toggleSearch,
  directoryStructure,
  filters,
  searchScope,
  tempSearchScope,
  onTempSearchScope,
  searchPhrase,
  onSearch,
  tempSearchPhrase,
  onTempSearch,
  setSearchStats,
  semanticSearchEnabled,
  tempSemanticSearchEnabled,
  onSemanticSearchToggle,
  fuzzySearchEnabled,
  tempFuzzySearchEnabled,
  onFuzzySearchToggle,
  showResultTabs = false,
  activeResultTab = "all",
  resultCounts = { all: 0, files: 0, folders: 0 },
  onChangeResultTab,
  totalAssetCount = 0,
  showExpandSidebar = false,
  onExpandSidebar,
}) => {
  const { __ } = useTranslation();
  const { collapsibleFilters, showSearch } = useConfiguration();
  const { sortParams } = useSort();
  const { isNewCard, toggleCardView } = useCardView();
  const { selectionCount, confirmSelection, cancelSelection } = useSelection();

  const handleSearchToggle = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    toggleSearch();
  };

  const isSearchVisible = showSearch;
  const selectLabel = __("assetPicker.select") || "Select";
  const cancelLabel = __("assetPicker.cancel") || "Cancel";

  return (
    <div className={styles.panel}>
      <div className={styles.searchPanel}>
        <div className={styles.toolbar}>
          <div className={styles.leftControls}>
            {showExpandSidebar && onExpandSidebar && (
              <button
                type="button"
                className={styles.expandButton}
                onClick={onExpandSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ExpandIcon className={styles.expandIcon} />
              </button>
            )}
            <button
              type="button"
              className={classNames(styles.cardViewToggle, {
                [styles.cardViewToggleActive]: isNewCard,
              })}
              onClick={toggleCardView}
              aria-pressed={isNewCard}
              aria-label={isNewCard ? "Switch to classic card view" : "Switch to new card view"}
              title={isNewCard ? "Switch to classic view" : "Try the new card view ✨"}
            >
              <span className={styles.cardViewPulse} aria-hidden="true" />
              <BsCardImage className={styles.cardViewIcon} />
            </button>
          </div>

          <div className={styles.searchWrapper}>
            {isSearchVisible && (
              <Search
                phrase={searchPhrase}
                scope={searchScope}
                onSearch={onSearch}
                onTempSearchScope={onTempSearchScope}
                onTempSearch={onTempSearch}
                tempSearchPhrase={tempSearchPhrase}
                tempSearchScope={tempSearchScope}
                setSearchStats={setSearchStats}
                semanticSearchEnabled={semanticSearchEnabled}
                tempSemanticSearchEnabled={tempSemanticSearchEnabled}
                onSemanticSearchToggle={onSemanticSearchToggle}
                fuzzySearchEnabled={fuzzySearchEnabled}
                tempFuzzySearchEnabled={tempFuzzySearchEnabled}
                onFuzzySearchToggle={onFuzzySearchToggle}
              />
            )}
          </div>

          <div className={styles.toolbarActions}>
            {sortParams.length > 0 && (
              <div className={styles.sortControl}>
                <Sort />
              </div>
            )}

            <div className={styles.viewControls}>
              <BrowserViewToggle />
            </div>

            <div className={styles.assetCount}>
              Assets: <strong>{totalAssetCount}</strong>
            </div>

            <div className={styles.pickerActions}>
              <Button className={styles.cancelButton} onClick={cancelSelection}>
                {cancelLabel}
              </Button>
              <Button
                className={styles.selectButton}
                onClick={confirmSelection}
                disabled={selectionCount === 0}
                title={selectionCount === 0 ? "Select at least one asset" : undefined}
              >
                {selectionCount > 0 ? `${selectLabel} (${selectionCount})` : selectLabel}
              </Button>
            </div>
          </div>

          <div className={styles.rightControls}>
            <button
              type="button"
              className={classNames(styles.searchToggle, {
                [styles.hideOnDesktop]: !filters || !collapsibleFilters,
              })}
              onClick={handleSearchToggle}
              aria-label="Toggle search"
            >
              <AiOutlineSearch />
            </button>
          </div>
        </div>

        {showResultTabs && onChangeResultTab && (
          <div className={styles.resultTabsRow} role="tablist" aria-label="Result type">
            <button
              type="button"
              role="tab"
              aria-selected={activeResultTab === "all"}
              className={classNames(styles.resultTab, {
                [styles.resultTabActive]: activeResultTab === "all",
              })}
              onClick={() => onChangeResultTab("all")}
            >
              All <span className={styles.resultTabCount}>({resultCounts.all})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeResultTab === "files"}
              className={classNames(styles.resultTab, {
                [styles.resultTabActive]: activeResultTab === "files",
              })}
              onClick={() => onChangeResultTab("files")}
            >
              Files <span className={styles.resultTabCount}>({resultCounts.files})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeResultTab === "folders"}
              className={classNames(styles.resultTab, {
                [styles.resultTabActive]: activeResultTab === "folders",
              })}
              onClick={() => onChangeResultTab("folders")}
            >
              Folders <span className={styles.resultTabCount}>({resultCounts.folders})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
