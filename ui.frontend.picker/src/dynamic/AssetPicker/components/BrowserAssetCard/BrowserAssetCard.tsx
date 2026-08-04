import { FC, useRef, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { FiLock } from "react-icons/fi";
import { TiTick } from "react-icons/ti";

import classNames from "classnames";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useSelection } from "../../contexts/Selection.context";
import { AssetItem } from "../../models/directoryStructure";
import { isTextClamped } from "../../utils/isTextClamped";
import { QuickViewModal } from "../QuickViewModal";
import { VideoHoverThumbnail } from "../VideoHoverThumbnail";

import styles from "./BrowserAssetCard.module.scss";

type BrowserAssetCardProps = {
  asset: AssetItem;
};

type MetadataEntry = {
  label?: string;
  value?: string;
  key?: string;
  name?: string;
};

const getMetaByLabel = (metadata: MetadataEntry[] | undefined, label: string): MetadataEntry | undefined => {
  if (!Array.isArray(metadata)) return undefined;
  const target = label.toLowerCase();
  return metadata.find((m) => (m.label ?? m.key ?? m.name ?? "").toString().toLowerCase() === target);
};

const formatMime = (mime: string | undefined | null): string => {
  if (!mime) return "";
  return mime.charAt(0).toUpperCase() + mime.slice(1).toLowerCase();
};

export const BrowserAssetCard: FC<BrowserAssetCardProps> = ({ asset }) => {
  const { __ } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const { enableDpiView, enableDetailedView } = useConfiguration();
  const nameElement = useRef<HTMLDivElement>(null);
  const { toggleAsset, isSelected } = useSelection();

  if (!asset.data) {
    return null;
  }

  const { thumbnail, name, size, mime, realPath, resolution, metadata } = asset.data;

  const metadataArray: MetadataEntry[] = Array.isArray(metadata) ? metadata : [];
  const selected = isSelected(realPath);

  const statusFromMeta = getMetaByLabel(metadataArray, "status")?.value;
  const fileTypeLabel = formatMime(mime);
  const titleFromMeta = getMetaByLabel(metadataArray, "title")?.value;
  const displayTitle = titleFromMeta || name;

  const isResolutionValid = enableDpiView ? resolution.dpi > 0 : resolution.width > 0 && resolution.height > 0;

  const resolutionValue = enableDpiView
    ? isResolutionValid
      ? String(resolution.dpi)
      : ""
    : isResolutionValid
      ? `${resolution.width}x${resolution.height}`
      : "";

  const resolutionLabel =
    enableDpiView && resolution.dpi > 0
      ? __("directoryExplorer.assetDpi") || "DPI"
      : isResolutionValid
        ? __("directoryExplorer.assetResolution") || "Resolution"
        : "";

  const dimensionValue = resolution.dimensions ?? "";
  const dimensionLabel = dimensionValue ? __("directoryExplorer.assetDimension") || "Dimension" : "";

  const EXCLUDED_META_KEYS = new Set(["status", "title"]);
  const extraMetadata = metadataArray.filter((m) => {
    const k = (m.label ?? m.key ?? m.name ?? "").toString().toLowerCase();
    return k && !EXCLUDED_META_KEYS.has(k);
  });

  const sizeLabel = enableDetailedView
    ? __("directoryExplorer.assetFilesize") || "File size"
    : __("directoryExplorer.assetSize") || "Size";

  const isRestricted = statusFromMeta?.toLowerCase() === "restricted";

  const isNameTooltipNeeded = (): boolean => {
    const element = nameElement.current;
    if (!isHovered || !element) return false;
    return isTextClamped(element) || element.scrollWidth > element.clientWidth;
  };

  const handleSelect = () => {
    if (isRestricted) return;
    toggleAsset(asset);
  };

  return (
    <>
      <div
        className={classNames(styles.card, {
          [styles.selectedCard]: selected,
          [styles.restrictedCard]: isRestricted,
        })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSelect}
        role="button"
        tabIndex={isRestricted ? -1 : 0}
        aria-disabled={isRestricted}
        aria-pressed={selected}
        onKeyDown={(event) => {
          if (isRestricted) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSelect();
          }
        }}
      >
        <div className={styles.media}>
          <div className={styles.imageWrapper}>
            <VideoHoverThumbnail
              thumbnailUrl={thumbnail.url}
              videoSrc={realPath}
              alt={name}
              name={name}
              mime={mime}
              mediaClassName={styles.image}
              externalHovering={isHovered}
            />
          </div>

          {isRestricted && (
            <div className={styles.restrictedOverlay} aria-hidden="true">
              <span className={styles.restrictedBadge}>
                <FiLock className={styles.restrictedIcon} />
                Restricted
              </span>
            </div>
          )}

          {!isRestricted && (
            <button
              type="button"
              className={styles.hoverActionMenu}
              onClick={(event) => {
                event.stopPropagation();
                setShowQuickView(true);
              }}
              title={__("assetPicker.quickView")}
              aria-label={__("assetPicker.quickView")}
            >
              <AiOutlineEye size={16} />
            </button>
          )}

          {selected && !isRestricted && (
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

        <div className={styles.infoPanel}>
          {statusFromMeta && (
            <span
              className={classNames(styles.statusChip, {
                [styles.statusChipRestricted]: statusFromMeta.toLowerCase() === "restricted",
              })}
            >
              {statusFromMeta}
            </span>
          )}

          {fileTypeLabel && (
            <div className={styles.fileType}>
              <span className={styles.fileTypeLabel}>File type:</span>{" "}
              <span className={styles.fileTypeValue}>{fileTypeLabel}</span>
            </div>
          )}

          <div className={styles.titleWrap}>
            <span ref={nameElement} className={styles.assetName} title={displayTitle}>
              {displayTitle}
            </span>
            {isNameTooltipNeeded() && <div className={styles.nameTooltip}>{displayTitle}</div>}
          </div>

          <div className={styles.meta}>
            {dimensionValue && (
              <p className={styles.metaLine}>
                <span className={styles.metaLabel}>{dimensionLabel}:</span>{" "}
                <span className={styles.metaValue}>{dimensionValue}</span>
              </p>
            )}

            {resolutionValue && (
              <p className={styles.metaLine}>
                <span className={styles.metaLabel}>{resolutionLabel}:</span>{" "}
                <span className={styles.metaValue}>{resolutionValue}</span>
              </p>
            )}

            {extraMetadata.map((m, idx) => (
              <p key={idx} className={styles.metaLine}>
                <span className={styles.metaLabel}>{m.label ?? m.key ?? m.name ?? ""}:</span>{" "}
                <span className={styles.metaValue}>{m.value ?? "—"}</span>
              </p>
            ))}

            {size && (
              <p className={styles.metaLineSubtle}>
                <strong>{sizeLabel}:</strong> {size}
              </p>
            )}
          </div>
        </div>
      </div>

      {showQuickView && <QuickViewModal asset={asset} onClose={() => setShowQuickView(false)} />}
    </>
  );
};
