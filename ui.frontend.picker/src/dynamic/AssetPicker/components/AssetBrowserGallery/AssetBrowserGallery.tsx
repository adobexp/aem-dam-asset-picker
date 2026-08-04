import { FC } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import AutoSizer from "react-virtualized-auto-sizer";
import { GridChildComponentProps, VariableSizeGrid as Grid } from "react-window";

import classNames from "classnames";

import { useCardView } from "../../contexts/CardView.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useViewMode } from "../../contexts/ViewMode.context";
import { useCurrentDirectory } from "../../hooks/useCurrentDirectory";
import { ASSET_HEIGHT, DIRECTORY_HEIGHT, GAP, NEW_ASSET_HEIGHT, NEW_CARD_GAP } from "../../models/cardView";
import { DirectoryStructure } from "../../models/directoryStructure";
import { computeGridLayout } from "../../utils/gridColumns";
import { isDirectory } from "../../utils/isDirectory";
import { BrowserAssetCard } from "../BrowserAssetCard";
import { DirectoryCard } from "../DirectoryCard";
import { ListView } from "../ListView";
import { NewAssetCard } from "../NewAssetCard/NewAssetCard";

import styles from "./AssetBrowserGallery.module.scss";

type AssetBrowserGalleryProps = {
  directoryStructure: DirectoryStructure;
};

const SKELETON_CARD_COUNT = 6;

export const AssetBrowserGallery: FC<AssetBrowserGalleryProps> = ({ directoryStructure }) => {
  const { __ } = useTranslation();
  const directory = useCurrentDirectory(directoryStructure);
  const { viewMode } = useViewMode();
  const { isNewCard } = useCardView();

  const effectiveGap = isNewCard ? NEW_CARD_GAP : GAP;
  const effectiveAssetHeight = isNewCard ? NEW_ASSET_HEIGHT : ASSET_HEIGHT;

  if (!directory || directory.loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingState} role="status" aria-label={__("directoryExplorer.loading")}>
          <div className={styles.skeletonGrid}>
            {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
              <div key={index} className={styles.skeletonCard} aria-hidden="true">
                <div className={styles.skeletonMedia} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine} />
                  <div className={classNames(styles.skeletonLine, styles.skeletonLineShort)} />
                </div>
              </div>
            ))}
          </div>
          <span className={styles.skeletonLoadingText}>{__("directoryExplorer.loading")}</span>
        </div>
      </div>
    );
  }

  if ("error" in directory && directory.error === true) {
    return <div className={styles.directoryError}>{__("directoryExplorer.failedToLoadDirectory")}</div>;
  }

  if (!isDirectory(directory)) {
    return null;
  }

  const { childPaths = [] } = directory.data || {};
  const children = childPaths.map(({ path }) => directoryStructure[path]);
  const isEmpty = children.length === 0;

  return (
    <div className={styles.wrapper}>
      {isEmpty ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <AiOutlineInfoCircle />
          </div>
          <span>{__("directoryExplorer.noAssets")}</span>
        </div>
      ) : (
        <div className={styles.items}>
          <div key={`${viewMode}-${isNewCard ? "new" : "classic"}`} className={styles.viewContainer}>
            {viewMode === "grid" ? (
              <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                  const EDGE_PADDING = 0;
                  const computedGap = effectiveGap;
                  const sideMargin = EDGE_PADDING;

                  const { columnCount, columnWidth: dynamicItemWidth } = computeGridLayout(
                    width - EDGE_PADDING * 2,
                    isNewCard ? 236 : 280,
                    computedGap,
                  );
                  const rowCount = Math.ceil(children.length / columnCount);

                  return (
                    <Grid
                      rowCount={rowCount}
                      columnCount={columnCount}
                      width={width}
                      height={height}
                      rowHeight={(index) => {
                        const rowItems = children.slice(index * columnCount, (index + 1) * columnCount);
                        const areAllDirectories = rowItems.every((item) => isDirectory(item));
                        if (areAllDirectories) return DIRECTORY_HEIGHT + effectiveGap;
                        return effectiveAssetHeight + effectiveGap;
                      }}
                      columnWidth={() => dynamicItemWidth}
                      useIsScrolling
                    >
                      {({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
                        const index = rowIndex * columnCount + columnIndex;
                        const item = children[index];

                        // Keep original cell geometry so NewAssetCard overlay icons (eye/details)
                        // remain fully visible. Hover shadow is handled in card CSS only.
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
              <ListView assets={children} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
