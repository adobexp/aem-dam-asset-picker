import { FC, useRef, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { TiTick } from "react-icons/ti";

import classNames from "classnames";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useSelection } from "../../contexts/Selection.context";
import { AssetItem } from "../../models/directoryStructure";
import { isTextClamped } from "../../utils/isTextClamped";
import { QuickViewModal } from "../QuickViewModal";
import { VideoHoverThumbnail } from "../VideoHoverThumbnail";

import styles from "./NewAssetCard.module.scss";

type NewAssetCardProps = {
  asset: AssetItem;
};

export const NewAssetCard: FC<NewAssetCardProps> = ({ asset }) => {
  const { __ } = useTranslation();
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [isMediaHovered, setIsMediaHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const { metadataView, enableDpiView, enableDetailedView } = useConfiguration();

  const nameElement = useRef<HTMLDivElement>(null);
  const { toggleAsset, isSelected } = useSelection();

  if (!asset.data) {
    return null;
  }

  const { thumbnail, name, size, mime, realPath, resolution } = asset.data;

  const selected = isSelected(realPath);

  const isNameTooltipNeeded = (): boolean => {
    const element = nameElement.current;
    if (!isNameHovered || !element) {
      return false;
    }
    return isTextClamped(element) || element.scrollWidth > element.clientWidth;
  };

  const handleSelect = () => {
    toggleAsset(asset);
  };

  const handleQuickViewClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setShowQuickView(true);
  };

  const resolutionLabel =
    (enableDpiView || enableDetailedView) && resolution.dpi > 0
      ? __("directoryExplorer.assetDpi")
      : !enableDpiView && !enableDetailedView
        ? __("directoryExplorer.assetResolution")
        : "";

  const isResolutionValid = enableDpiView ? resolution.dpi > 0 : resolution.width > 0 && resolution.height > 0;

  const formattedResolution = enableDpiView
    ? isResolutionValid
      ? resolution.dpi
      : ""
    : isResolutionValid
      ? `${resolution.width}×${resolution.height}`
      : "";

  const sizeLabel = enableDetailedView ? __("directoryExplorer.assetFilesize") : __("directoryExplorer.assetSize");

  const typeLabel =
    enableDetailedView && resolution.dimensions != null
      ? __("directoryExplorer.assetDimension")
      : __("directoryExplorer.assetType");

  const typeValue = enableDetailedView && resolution.dimensions != null ? resolution.dimensions : mime;

  return (
    <>
      <div
        className={classNames(styles.card, {
          [styles.selectedCard]: selected,
        })}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSelect();
          }
        }}
      >
        <div
          className={styles.imageSection}
          onMouseEnter={() => setIsMediaHovered(true)}
          onMouseLeave={() => setIsMediaHovered(false)}
        >
          <div className={styles.imageWrapper}>
            <VideoHoverThumbnail
              thumbnailUrl={thumbnail.url}
              videoSrc={realPath}
              alt={name}
              name={name}
              mime={mime}
              mediaClassName={styles.thumbnail}
              externalHovering={isMediaHovered}
            />
          </div>

          {!selected && (
            <div className={styles.hoverOverlay}>
              <div
                className={classNames(styles.overlayMeta, {
                  [styles.overlayMetaVertical]: metadataView === "vertical",
                  [styles.overlayMetaHorizontal]: metadataView === "horizontal",
                })}
              >
                {typeLabel && typeValue && (
                  <div
                    className={classNames(styles.metaRow, {
                      [styles.metaRowVertical]: metadataView === "vertical",
                      [styles.metaRowHorizontal]: metadataView === "horizontal",
                    })}
                  >
                    <span className={styles.metaLabel}>{typeLabel}</span>
                    <span className={styles.metaValue}>{typeValue}</span>
                  </div>
                )}
                {resolutionLabel && formattedResolution && (
                  <div
                    className={classNames(styles.metaRow, {
                      [styles.metaRowVertical]: metadataView === "vertical",
                      [styles.metaRowHorizontal]: metadataView === "horizontal",
                    })}
                  >
                    <span className={styles.metaLabel}>{resolutionLabel}</span>
                    <span className={styles.metaValue}>{formattedResolution}</span>
                  </div>
                )}
                {size && (
                  <div
                    className={classNames(styles.metaRow, {
                      [styles.metaRowVertical]: metadataView === "vertical",
                      [styles.metaRowHorizontal]: metadataView === "horizontal",
                    })}
                  >
                    <span className={styles.metaLabel}>{sizeLabel}</span>
                    <span className={styles.metaValue}>{size}</span>
                  </div>
                )}
              </div>

              <div className={styles.overlayActions}>
                <button
                  type="button"
                  className={styles.overlayActionBtn}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelect();
                  }}
                  title={__("assetPicker.select")}
                >
                  <TiTick />
                </button>

                <button
                  type="button"
                  className={styles.overlayActionBtn}
                  onClick={handleQuickViewClick}
                  title={__("assetPicker.quickView")}
                  aria-label={__("assetPicker.quickView")}
                >
                  <AiOutlineEye />
                </button>
              </div>
            </div>
          )}

          {selected && (
            <div
              className={styles.selected}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect();
              }}
            >
              <TiTick />
            </div>
          )}
        </div>

        <div
          className={styles.cardFooter}
          onMouseEnter={() => setIsNameHovered(true)}
          onMouseLeave={() => setIsNameHovered(false)}
        >
          <div className={styles.nameWrapper}>
            <span ref={nameElement} className={styles.name}>
              {name}
            </span>
            {isNameTooltipNeeded() && (
              <div className={styles.nameTooltip}>
                <div className={styles.nameTooltipContent}>{name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuickView && <QuickViewModal asset={asset} onClose={() => setShowQuickView(false)} />}
    </>
  );
};
