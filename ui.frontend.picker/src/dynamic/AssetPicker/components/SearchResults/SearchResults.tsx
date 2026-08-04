import { FC, useCallback, useEffect, useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { GridChildComponentProps, VariableSizeGrid as Grid } from "react-window";

import { useCardView } from "../../contexts/CardView.context";
import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useSort } from "../../contexts/Sort.context";
import { useViewMode } from "../../contexts/ViewMode.context";
import { useCurrentDirectory } from "../../hooks/useCurrentDirectory";
import { Directory } from "../../models/api";
import { ASSET_HEIGHT, DIRECTORY_HEIGHT, GAP, ITEM_WIDTH, NEW_ASSET_HEIGHT, NEW_CARD_GAP } from "../../models/cardView";
import { AssetItem, DirectoryItem, DirectoryStructure } from "../../models/directoryStructure";
import { Filter as FilterModel, SelectedFilterOption } from "../../models/filter";
import { SearchScope } from "../../models/search";
import { Stats } from "../../models/stats";
import { fetchJson, searchUrl } from "../../utils/apiClient";
import { computeGridLayout } from "../../utils/gridColumns";
import { isAsset } from "../../utils/isAsset";
import { isDirectory } from "../../utils/isDirectory";
import { mapAsset } from "../../utils/mapAsset";
import { mapDirectory } from "../../utils/mapDirectory";
import { BrowserAssetCard } from "../BrowserAssetCard";
import { DirectoryCard } from "../DirectoryCard";
import { ListView } from "../ListView";
import { NewAssetCard } from "../NewAssetCard/NewAssetCard";
import { SelectedFilters } from "../SelectedFilters";

import styles from "./SearchResults.module.scss";

type SearchResponse = Directory & {
  hasNextPage: boolean;
  total: number;
  displayed: number;
  time: number;
};

export type ResultTab = "all" | "files" | "folders";

export type ResultCounts = {
  all: number;
  files: number;
  folders: number;
};

export type SearchResultsProps = {
  directoryStructure: DirectoryStructure;
  search: string;
  searchScope: SearchScope;
  semanticSearchEnabled: boolean;
  fuzzySearchEnabled: boolean;
  selectedFilterOptions: SelectedFilterOption[];
  serializedFilters: Array<Record<string, string | string[]>>;
  filters: FilterModel[] | null;
  removeFilterOption: (filterId: string, optionId: string) => void;
  setShowBlockingLoader: (show: boolean) => void;
  setSearchStats: (searchStats: Stats | null) => void;

  /* New props — owned by AssetBrowser, rendered by SettingsPanel */
  activeResultTab: ResultTab;
  onCountsChange: (counts: ResultCounts) => void;
};

const extractAssets = (response: SearchResponse): (AssetItem | DirectoryItem)[] => {
  const { items } = response;
  return items.map((item) => {
    if (item.type === "asset") return mapAsset(item);
    return mapDirectory({ ...item });
  });
};

export const SearchResults: FC<SearchResultsProps> = ({
  directoryStructure,
  search,
  searchScope,
  semanticSearchEnabled,
  fuzzySearchEnabled,
  selectedFilterOptions,
  serializedFilters,
  removeFilterOption,
  setShowBlockingLoader,
  setSearchStats,
  activeResultTab,
  onCountsChange,
}) => {
  const { apiBase, searchPageSize, pickerParams } = useConfiguration();
  const { __ } = useTranslation();
  const { sortId, sortOrder } = useSort();
  const { viewMode } = useViewMode();
  const { isNewCard } = useCardView();
  const directory = useCurrentDirectory(directoryStructure);

  const [hasResults, setHasResults] = useState<boolean | null>(null);
  const [nextPage, setNextPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchResults, setSearchResults] = useState<(AssetItem | DirectoryItem)[]>([]);

  const effectiveGap = isNewCard ? NEW_CARD_GAP : GAP;
  const effectiveAssetHeight = isNewCard ? NEW_ASSET_HEIGHT : ASSET_HEIGHT;

  // Distinguish empty-state reasons (search vs filters vs both)
  const hasSearchQuery = search.trim() !== "";
  const hasActiveFilters = selectedFilterOptions.length > 0;

  /* ============================================================
     Client-side split: files vs folders for tab counts/rendering
     ============================================================ */
  const { filesItems, foldersItems } = useMemo(() => {
    const filesItems = searchResults.filter((item) => isAsset(item));
    const foldersItems = searchResults.filter((item) => isDirectory(item));
    return { filesItems, foldersItems };
  }, [searchResults]);

  const visibleResults = useMemo(() => {
    if (activeResultTab === "files") return filesItems;
    if (activeResultTab === "folders") return foldersItems;
    return searchResults;
  }, [activeResultTab, searchResults, filesItems, foldersItems]);

  /* Report counts up to AssetBrowser → SettingsPanel */
  useEffect(() => {
    onCountsChange({
      all: searchResults.length,
      files: filesItems.length,
      folders: foldersItems.length,
    });
  }, [searchResults.length, filesItems.length, foldersItems.length, onCountsChange]);

  /* ============================================================
     API fetch (unchanged behavior)
     ============================================================ */
  const fetchSearchResults = useCallback(
    async ({ path, page }: { path: string; page: number }) => {
      const realPath = path.split("|").at(-1) ?? path;
      const cleanedSearch = search.trim();

      const requestUrl = searchUrl(
        apiBase,
        {
          path: realPath,
          page,
          pageSize: searchPageSize ?? 100,
          files: searchScope === "files" || searchScope === "filesAndFolders",
          folders: searchScope === "folders" || searchScope === "filesAndFolders",
          semanticSearchEnabled,
          fuzzySearchEnabled,
          filters: serializedFilters,
          ...(cleanedSearch && { search: cleanedSearch }),
          ...(sortId && { sortId, sortOrder }),
        },
        pickerParams,
      );

      return fetchJson<SearchResponse>(requestUrl);
    },
    [
      apiBase,
      pickerParams,
      search,
      searchPageSize,
      searchScope,
      semanticSearchEnabled,
      fuzzySearchEnabled,
      serializedFilters,
      sortId,
      sortOrder,
    ],
  );

  /* First page fetch */
  useEffect(() => {
    async function fetchFirstPage() {
      if (!directory?.data?.path) return;
      const response = await fetchSearchResults({
        path: directory.data.path,
        page: nextPage,
      });
      const assets = extractAssets(response);
      setSearchResults(assets);
      setNextPage(1);
      setHasNextPage(response.hasNextPage);
      setSearchStats({
        total: response.total,
        displayed: response.displayed,
        time: response.time,
      });
      setHasResults(assets.length !== 0);
    }
    if (nextPage !== 0) return;
    fetchFirstPage();
  }, [nextPage, fetchSearchResults, directory?.data?.path, setSearchStats, sortOrder, sortId]);

  useEffect(() => {
    setShowBlockingLoader(hasResults === null);
    return () => setShowBlockingLoader(false);
  }, [hasResults, setShowBlockingLoader]);

  const loadNextPage = async () => {
    if (!directory?.data?.path) return;
    if (!hasNextPage || isLoading) return;

    console.info(`Fetching search results page: ${nextPage}`);

    setIsLoading(true);
    const response = await fetchSearchResults({
      path: directory.data.path,
      page: nextPage,
    });
    const assets = extractAssets(response);
    setSearchResults((results) => [...results, ...assets]);
    setNextPage((page) => page + 1);
    setHasNextPage(response.hasNextPage);
    setIsLoading(false);
  };

  /* Clear ALL applied filter options — keeps search query intact */
  const handleClearFilters = useCallback(() => {
    selectedFilterOptions.forEach(({ filterId, valueId }) => {
      removeFilterOption(filterId, valueId);
    });
  }, [selectedFilterOptions, removeFilterOption]);

  if (!directory?.data) {
    return null;
  }

  if (hasResults === null) {
    return null;
  }

  /* ============================================================
     Empty-state copy logic
     ============================================================ */
  const emptyCopy = (() => {
    if (hasSearchQuery && hasActiveFilters) {
      return {
        title: __("directoryExplorer.noResultsFound") || "No results found",
        message:
          __("directoryExplorer.noAssetsMatchSearchAndFilters") ||
          "No assets match your current search and filters. Please try again.",
        showClearFilters: true,
      };
    }
    if (hasActiveFilters) {
      return {
        title: __("directoryExplorer.noResultsFound") || "No results found",
        message:
          __("directoryExplorer.noAssetsMatchFilters") || "No assets match your current filters. Please try again.",
        showClearFilters: true,
      };
    }
    return {
      title: __("directoryExplorer.noResultsFound") || "No results found",
      message: __("directoryExplorer.noAssetsMatchSearch") || "No assets match your current search. Please try again.",
      showClearFilters: false,
    };
  })();

  const noResultsForTab = visibleResults.length === 0 && searchResults.length > 0;

  return (
    <div className={styles.wrapper}>
      {/* ============================================================
          ACTIVE FILTER CHIPS (existing component, untouched)
          ============================================================ */}
      {selectedFilterOptions.length > 0 && (
        <div className={styles.filterRow}>
          <SelectedFilters
            search={search}
            selectedFilterOptions={selectedFilterOptions}
            removeFilterOption={removeFilterOption}
          />
        </div>
      )}

      {/* ============================================================
          EMPTY / RESULT VIEW
          ============================================================ */}
      {hasResults === false ? (
        /* True empty: API returned 0 results */
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{emptyCopy.title}</h2>
          <p className={styles.emptyMessage}>{emptyCopy.message}</p>
          {emptyCopy.showClearFilters && (
            <button type="button" className={styles.clearFiltersBtn} onClick={handleClearFilters}>
              {__("directoryExplorer.clearFilters") || "Clear filters"}
            </button>
          )}
        </div>
      ) : noResultsForTab ? (
        /* Tab-level empty: API returned results, but the active tab has none */
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{__("directoryExplorer.noResultsFound") || "No results found"}</h2>
          <p className={styles.emptyMessage}>
            {activeResultTab === "files"
              ? __("directoryExplorer.noFilesInResults") || "No files match your current search. Please try again."
              : __("directoryExplorer.noFoldersInResults") || "No folders match your current search. Please try again."}
          </p>
        </div>
      ) : (
        <div className={styles.items}>
          {viewMode === "grid" ? (
              <AutoSizer key={`${viewMode}-${isNewCard ? "new" : "classic"}-${activeResultTab}`}>
                {({ height, width }: { height: number; width: number }) => {
                  const EDGE_PADDING = 20;
                  const computedGap = effectiveGap;
                  const sideMargin = EDGE_PADDING;

                  const { columnCount, columnWidth: dynamicItemWidth } = computeGridLayout(
                    width - EDGE_PADDING * 2,
                    isNewCard ? 236 : 280,
                    computedGap,
                  );
                  const rowCount = Math.ceil(visibleResults.length / columnCount);

                  return (
                    <Grid
                      rowCount={rowCount}
                      columnCount={columnCount}
                      width={width}
                      height={height}
                      rowHeight={(index) => {
                        const rowItems = visibleResults.slice(index * columnCount, (index + 1) * columnCount);
                        const areAllDirectories = rowItems.length > 0 && rowItems.every((item) => isDirectory(item));
                        if (areAllDirectories) return DIRECTORY_HEIGHT + effectiveGap;
                        return effectiveAssetHeight + effectiveGap;
                      }}
                      columnWidth={() => dynamicItemWidth}
                      useIsScrolling
                      onScroll={(ev) => {
                        const offset = 50;
                        const rowHeight = effectiveAssetHeight + effectiveGap;
                        const hasScrolledToEnd = rowHeight * rowCount - height - ev.scrollTop < offset;
                        if (hasScrolledToEnd) {
                          /* Only paginate when viewing the unfiltered tab,
                 otherwise the next page may not contain items
                 of the active tab's type. */
                          if (activeResultTab === "all") {
                            loadNextPage();
                          }
                        }
                      }}
                    >
                      {({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
                        const index = rowIndex * columnCount + columnIndex;
                        const item = visibleResults[index];

                        const styleWithGaps: React.CSSProperties = {
                          ...style,
                          left: sideMargin + columnIndex * dynamicItemWidth + columnIndex * computedGap,
                          top: Number(style.top) + effectiveGap,
                          width: dynamicItemWidth,
                          height: Number(style.height) - effectiveGap,
                          boxSizing: "border-box",
                          padding: "2px",
                        };

                        if (!item?.data) {
                          return null;
                        }

                        if (isDirectory(item)) {
                          const data = item.data;
                          return (
                            <div style={styleWithGaps}>
                              <DirectoryCard
                                path={data.path}
                                thumbnail={data.thumbnail}
                                childrenCount={data.childrenCount}
                              >
                                {data.name}
                              </DirectoryCard>
                            </div>
                          );
                        }

                        return (
                          <div style={styleWithGaps}>
                            {isNewCard ? <NewAssetCard asset={item} /> : <BrowserAssetCard asset={item} />}
                          </div>
                        );
                      }}
                    </Grid>
                  );
                }}
              </AutoSizer>
            ) : (
              <ListView assets={visibleResults} />
            )}
          </div>
      )}
    </div>
  );
};
