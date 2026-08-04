import { FC, useCallback, useEffect, useRef, useState } from "react";
import { BsGripVertical } from "react-icons/bs";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import classNames from "classnames";

import CollapseIcon from "../../../../assets/images/collapseIcon.svg";
import { useConfiguration } from "../../contexts/Configuration.context";
import { useSort } from "../../contexts/Sort.context";
import { getBreadcrumbs, useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useCurrentDirectory } from "../../hooks/useCurrentDirectory";
import { useDirectories } from "../../hooks/useDirectories";
import { useFilters } from "../../hooks/useFilters";
import { useMobileNavigation } from "../../hooks/useMobileNavigation";
import { useResizableSidebar } from "../../hooks/useResizableSidebar";
import { useSearch } from "../../hooks/useSearch";
import { SAVED_PATH_KEY } from "../../models/consts";
import { Stats } from "../../models/stats";
import { removePrefix } from "../../utils/removePrefix";
import { AssetBrowserGallery } from "../AssetBrowserGallery";
import { Breadcrumbs } from "../Breadcrumbs";
import { DirectoryTree } from "../DirectoryTree";
import { Filters } from "../Filters";
import { Loader } from "../Loader";
import { SearchResults } from "../SearchResults";
// import { ResultCounts, ResultTab } from "../SearchResults/SearchResults";
import { SettingsPanel } from "../SettingsPanel";

import styles from "./AssetPickerView.module.scss";

type SidebarView = "tree" | "filters";

type ResultTab = "all" | "files" | "folders";

const SIDEBAR_COLLAPSED_KEY = "assetPicker.sidebarCollapsed";
const SIDEBAR_VIEW_KEY = "assetPicker.sidebarView";
const MOBILE_BREAKPOINT_PX = 767;

const isMobileViewport = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;

export const AssetPickerView: FC = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const location = useLocation();
  const path = location.pathname;
  const { rootDirectories, enableDirectorySidebarCollapse, pickerViewMode } = useConfiguration();
  const { sortOrder, sortId } = useSort();
  const { isOpen: isNavigationOpen, toggle: toggleNavigation } = useMobileNavigation();
  const [showBlockingLoader, setShowBlockingLoader] = useState(false);

  const [searchStats, setSearchStats] = useState<Stats | null>(null);
  const [directoryStats, setDirectoryStats] = useState<Stats | null>(null);

  const [resultTab, setResultTab] = useState<ResultTab>("all");
  const [resultCounts, setResultCounts] = useState({ all: 0, files: 0, folders: 0 });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (isMobileViewport()) {
        return true;
      }
      if (enableDirectorySidebarCollapse === false) {
        return false;
      }
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (enableDirectorySidebarCollapse === false && !isMobileViewport()) {
      setIsSidebarCollapsed(false);
    }
  }, [enableDirectorySidebarCollapse]);

  const [activeSidebarView, setActiveSidebarView] = useState<SidebarView>(() => {
    // A host that launched the picker in search mode wants the search and filter panel,
    // otherwise fall back to whatever the user last had open.
    if (pickerViewMode === "search") {
      return "filters";
    }
    try {
      const stored = localStorage.getItem(SIDEBAR_VIEW_KEY) as SidebarView | null;
      return stored === "tree" || stored === "filters" ? stored : "filters";
    } catch {
      return "filters";
    }
  });

  useEffect(() => {
    try {
      if (!isMobileViewport()) {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
      }
    } catch {
      /* ignore */
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_VIEW_KEY, activeSidebarView);
    } catch {
      /* ignore */
    }
  }, [activeSidebarView]);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsSidebarCollapsed(true);
      } else {
        try {
          const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
          setIsSidebarCollapsed(stored);
        } catch {
          setIsSidebarCollapsed(false);
        }
      }
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isMobileViewport() && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const savedPathRef = useRef(sessionStorage.getItem(SAVED_PATH_KEY));

  const {
    filters,
    selectedFilterOptions,
    serializedFilters,
    changeFilter,
    changeFilters,
    removeFilterOption,
    toggleFilter,
  } = useFilters();

  const {
    search,
    tempSearch,
    setTempSearch,
    searchScope,
    tempSearchScope,
    setTempSearchScope,
    semanticSearchEnabled,
    tempSemanticSearchEnabled,
    setTempSemanticSearchEnabled,
    fuzzySearchEnabled,
    tempFuzzySearchEnabled,
    setTempFuzzySearchEnabled,
    handleSearch,
  } = useSearch();

  const calculateMaxSidebarWidth = useCallback(() => {
    const minContentWidth = 360;
    const maxAllowedWidth = 400;
    return Math.min(maxAllowedWidth, window.innerWidth - minContentWidth);
  }, []);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const {
    handleResizeMouseDown: handleResizeSidebarMouseDown,
    isResizing: isSidebarResizing,
    sidebarWidth,
  } = useResizableSidebar({
    sidebarRef: sidebarRef,
    minWidth: 200,
    maxWidth: calculateMaxSidebarWidth,
    side: "left",
  });

  const { directoryStructure, setDirectoryStructure, fetchDirectory } = useDirectories({ setDirectoryStats });
  const breadcrumbs = useBreadcrumbs(directoryStructure);
  const [initialTree, setInitialTree] = useState(breadcrumbs);
  const currentDirectory = useCurrentDirectory(directoryStructure);

  const sort = { sortId, sortOrder };

  useEffect(
    function fetchRootDirectories() {
      if (rootDirectories.length === 0) {
        return;
      }

      if (path === "/") {
        const savedPath = savedPathRef.current;
        if (savedPath) {
          sessionStorage.removeItem(SAVED_PATH_KEY);
          console.info(`Restoring saved path ${savedPath}`);
          navigate(savedPath);

          const rootDirectory = rootDirectories[0];
          const pathWithoutPrefix = removePrefix(path, rootDirectory);
          const breadcrumbs = getBreadcrumbs(pathWithoutPrefix, rootDirectory);

          setInitialTree(breadcrumbs);
          return;
        }

        navigate(rootDirectories[0]);
      }

      rootDirectories.forEach((path) => {
        fetchDirectory(path, sort);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootDirectories],
  );

  useEffect(() => {
    setResultTab("all");
  }, [search, JSON.stringify(serializedFilters)]);

  useEffect(() => {
    const fetchInitialTree = async () => {
      if (rootDirectories.length === 0) {
        return;
      }

      for (const breadcrumb of breadcrumbs) {
        const { path } = breadcrumb;
        await fetchDirectory(path, sort);
      }
    };

    fetchInitialTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootDirectories, initialTree]);

  useEffect(
    function handlePathChange() {
      const findMissingPaths = () => {
        const slugs = decodedPath.split("/");
        const breadcrumbs = slugs.map((_slug, index) => {
          return slugs.slice(0, index + 1).join("/") || "/";
        });
        for (let i = breadcrumbs.length - 1; i >= 0; i--) {
          const breadcrumb = breadcrumbs[i];
          const directory = directoryStructure[breadcrumb];
          if (directory && directory.data && directory.data.type === "directory" && !directory.data.expanded) {
            return breadcrumbs.slice(i);
          }
        }
        return [];
      };

      const fetchMissingPaths = async (paths: string[]) => {
        for (const path of paths) {
          await fetchDirectory(path, sort);
        }
      };

      const decodedPath = decodeURI(path);
      const sort = sortId ? { sortId, sortOrder } : undefined;
      const directory = directoryStructure[decodedPath];

      if (directory === undefined) {
        const missingPaths = findMissingPaths();
        fetchMissingPaths(missingPaths);
        return;
      }

      if (!directory.data || directory.data.type !== "directory") {
        return;
      }

      if (
        (!directory.data.expanded && !directory.loading) ||
        directory.data.sortId !== sortId ||
        directory.data.sortOrder !== sortOrder
      ) {
        fetchDirectory(decodedPath, sort);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path],
  );

  useEffect(
    function handleSortChange() {
      const data = currentDirectory?.data;

      if (!data || !data.path) {
        return;
      }

      if (data.sortId !== sortId || data.sortOrder !== sortOrder) {
        fetchDirectory(path, sort);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortId, sortOrder],
  );

  const handleExpandDirectory = useCallback(
    (path: string) => {
      fetchDirectory(path, sort);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortId, sortOrder],
  );

  const handleCollapseDirectory = useCallback(
    (path: string) => {
      const directory = directoryStructure[path]?.data;
      if (directory?.type !== "directory") {
        return;
      }

      setDirectoryStructure((prev) => ({
        ...prev,
        [path]: {
          data: {
            ...directory,
            expanded: false,
          },
          loading: false,
        },
      }));
    },
    [directoryStructure, setDirectoryStructure],
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const switchToTreeView = useCallback(() => {
    setActiveSidebarView("tree");
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  }, [isSidebarCollapsed]);

  const switchToFiltersView = useCallback(() => {
    setActiveSidebarView("filters");
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  }, [isSidebarCollapsed]);

  const handleBackdropClick = useCallback(() => {
    if (isMobileViewport()) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const showSearchResults = search.trim() !== "" || selectedFilterOptions.length > 0;
  const activeStats = showSearchResults ? searchStats : directoryStats;
  const totalAssetCount = activeStats?.total ?? 0;

  return (
    <div
      className={classNames(styles.assetPicker, {
        [styles.ready]: isReady,
        [styles.sidebarHidden]: isSidebarCollapsed,
        [styles.searchActive]: showSearchResults,
        [styles.sidebarResizing]: isSidebarResizing,
      })}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      {showBlockingLoader && (
        <div className={styles.blockingLoader}>
          <Loader />
        </div>
      )}

      {/* Mobile drawer backdrop */}
      <div
        className={classNames(styles.mobileBackdrop, {
          [styles.mobileBackdropVisible]: !isSidebarCollapsed,
        })}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {!isSidebarCollapsed && (
        <aside className={styles.sidebarWrapper}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTabs} role="tablist" aria-label="Sidebar view">
              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarView === "filters"}
                className={classNames(styles.sidebarTab, {
                  [styles.sidebarTabActive]: activeSidebarView === "filters",
                })}
                onClick={switchToFiltersView}
              >
                Filter
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarView === "tree"}
                className={classNames(styles.sidebarTab, {
                  [styles.sidebarTabActive]: activeSidebarView === "tree",
                })}
                onClick={switchToTreeView}
              >
                Tree
              </button>
            </div>

            {(enableDirectorySidebarCollapse || isMobileViewport()) && (
              <button type="button" className={styles.sidebarToggle} onClick={toggleSidebar}>
                <CollapseIcon />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              type="button"
              className={styles.collapsedLabel}
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <span className={styles.collapsedLabelText}>Content Tree &amp; Filters</span>
            </button>
          )}

          {!isSidebarCollapsed && (
            <>
              <div ref={sidebarRef} className={styles.sidebarContent}>
                {activeSidebarView === "tree" ? (
                  <DirectoryTree
                    directoryStructure={directoryStructure}
                    onExpandDirectory={handleExpandDirectory}
                    onCollapseDirectory={handleCollapseDirectory}
                  />
                ) : (
                  <div className={styles.filtersContent}>
                    <Filters
                      filters={filters}
                      toggleFilter={toggleFilter}
                      searchPhrase={search}
                      tempSearchPhrase={tempSearch}
                      searchScope={searchScope}
                      tempSearchScope={tempSearchScope}
                      onTempSearchScope={setTempSearchScope}
                      semanticSearchEnabled={semanticSearchEnabled}
                      tempSemanticSearchEnabled={tempSemanticSearchEnabled}
                      onSemanticSearchToggle={setTempSemanticSearchEnabled}
                      fuzzySearchEnabled={fuzzySearchEnabled}
                      tempFuzzySearchEnabled={tempFuzzySearchEnabled}
                      onFuzzySearchToggle={setTempFuzzySearchEnabled}
                      onSearch={handleSearch}
                      onTempSearch={setTempSearch}
                      onChange={changeFilter}
                      onChangeBatch={changeFilters}
                      onReset={() => {
                        setSearchParams(new URLSearchParams());
                      }}
                      searchStats={searchStats}
                      setSearchStats={setSearchStats}
                      directoryStats={directoryStats}
                      showStats={showSearchResults}
                    />
                  </div>
                )}
              </div>

              <div
                className={classNames(styles.resize, {
                  [styles.resizeActive]: isSidebarResizing,
                })}
                onMouseDown={handleResizeSidebarMouseDown}
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={sidebarWidth}
                aria-valuemin={200}
                aria-valuemax={400}
                aria-label="Resize sidebar"
                title="Drag to resize sidebar"
              >
                <span className={styles.resizeGrip} aria-hidden="true">
                  <BsGripVertical />
                </span>
              </div>
            </>
          )}
        </aside>
      )}

      {/* RIGHT: Top settings panel + main content stacked */}
      <section className={styles.rightColumn}>
        <div className={styles.settingsPanel}>
          <SettingsPanel
            isNavigationOpen={isNavigationOpen}
            toggleNavigation={toggleNavigation}
            toggleSearch={() => switchToFiltersView()}
            directoryStructure={directoryStructure}
            searchScope={searchScope}
            tempSearchScope={tempSearchScope}
            onTempSearchScope={setTempSearchScope}
            filters={filters}
            searchPhrase={search}
            onSearch={handleSearch}
            tempSearchPhrase={tempSearch}
            onTempSearch={setTempSearch}
            setSearchStats={setSearchStats}
            semanticSearchEnabled={semanticSearchEnabled}
            tempSemanticSearchEnabled={tempSemanticSearchEnabled}
            onSemanticSearchToggle={setTempSemanticSearchEnabled}
            fuzzySearchEnabled={fuzzySearchEnabled}
            tempFuzzySearchEnabled={tempFuzzySearchEnabled}
            onFuzzySearchToggle={setTempFuzzySearchEnabled}
            showResultTabs={showSearchResults}
            activeResultTab={resultTab}
            resultCounts={resultCounts}
            onChangeResultTab={setResultTab}
            totalAssetCount={totalAssetCount}
            showExpandSidebar={isSidebarCollapsed}
            onExpandSidebar={() => setIsSidebarCollapsed(false)}
          />

          <div className={styles.breadcrumbsRow}>
            <Breadcrumbs directoryStructure={directoryStructure} />
          </div>
        </div>

        <div className={styles.main}>
          {showSearchResults ? (
            <SearchResults
              key={`${currentDirectory?.data?.path}${search}${searchScope}${JSON.stringify(
                serializedFilters,
              )}${sortId}${sortOrder}${semanticSearchEnabled}${fuzzySearchEnabled}}`}
              directoryStructure={directoryStructure}
              search={search}
              searchScope={searchScope}
              semanticSearchEnabled={semanticSearchEnabled}
              fuzzySearchEnabled={fuzzySearchEnabled}
              selectedFilterOptions={selectedFilterOptions}
              serializedFilters={serializedFilters}
              filters={filters}
              removeFilterOption={removeFilterOption}
              setShowBlockingLoader={setShowBlockingLoader}
              setSearchStats={setSearchStats}
              activeResultTab={resultTab}
              onCountsChange={setResultCounts}
            />
          ) : (
            <AssetBrowserGallery key={currentDirectory?.data?.path} directoryStructure={directoryStructure} />
          )}
        </div>
      </section>
    </div>
  );
};
