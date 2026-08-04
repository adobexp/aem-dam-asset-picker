import { FC, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { Asset } from "../../models/api";
import { AssetItem } from "../../models/directoryStructure";
import { QuickViewMetadataField } from "../../models/quickView";
import { assetUrl, fetchJson } from "../../utils/apiClient";
import { mapAsset } from "../../utils/mapAsset";
import { AssetImage } from "../AssetImage/AssetImage";

import styles from "./QuickViewModal.module.scss";

interface QuickViewModalProps {
  asset: AssetItem;
  onClose: () => void;
}

interface MetadataField {
  label: string;
  value: string | number;
}

const BUILT_INS = new Set(["size", "filesize", "mime", "type", "resolution", "dpi", "dimensions", "dimension", "name"]);

const resolveBuiltInValue = (
  id: string,
  data: NonNullable<AssetItem["data"]>,
  enableDpiView: boolean,
  enableDetailedView: boolean,
): string | number | null => {
  const { size, mime, name, title, resolution } = data;
  switch (id) {
    case "name":
      return title || name || null;
    case "size":
    case "filesize":
      return size || null;
    case "mime":
    case "type":
      return mime || null;
    case "dimensions":
    case "dimension":
      return resolution?.dimensions || (resolution?.width > 0 && resolution?.height > 0
        ? `${resolution.width}×${resolution.height}`
        : null);
    case "dpi":
      return resolution?.dpi > 0 ? resolution.dpi : null;
    case "resolution": {
      if (enableDpiView && resolution?.dpi > 0) {
        return resolution.dpi;
      }
      if (resolution?.width > 0 && resolution?.height > 0) {
        return `${resolution.width}×${resolution.height}`;
      }
      return null;
    }
    default:
      return null;
  }
};

const legacyFields = (
  data: NonNullable<AssetItem["data"]>,
  enableDpiView: boolean,
  enableDetailedView: boolean,
  __: (key: string) => string,
): MetadataField[] => {
  const fields: MetadataField[] = [];
  const { size, mime, resolution, metadata: customMetadata } = data;

  const sizeLabel = enableDetailedView ? __("directoryExplorer.assetFilesize") : __("directoryExplorer.assetSize");
  if (size) {
    fields.push({ label: sizeLabel, value: size });
  }

  if (enableDetailedView && resolution.dimensions) {
    fields.push({
      label: __("directoryExplorer.assetDimension"),
      value: resolution.dimensions,
    });
  } else if (!enableDetailedView && mime) {
    fields.push({
      label: __("directoryExplorer.assetType"),
      value: mime,
    });
  }

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

  if (resolutionLabel && formattedResolution) {
    fields.push({ label: resolutionLabel, value: formattedResolution });
  }

  if (Array.isArray(customMetadata)) {
    customMetadata.forEach(({ label, value }) => {
      if (label && value !== undefined && value !== null && String(value).length > 0) {
        fields.push({ label, value });
      }
    });
  }

  return fields;
};

const configuredFields = (
  data: NonNullable<AssetItem["data"]>,
  config: QuickViewMetadataField[],
  enableDpiView: boolean,
  enableDetailedView: boolean,
): MetadataField[] => {
  const customByKey = new Map<string, string>();
  const customByLabel = new Map<string, string>();
  (data.metadata || []).forEach((entry) => {
    if (entry.value === undefined || entry.value === null || String(entry.value).length === 0) {
      return;
    }
    if (entry.key) {
      customByKey.set(entry.key, entry.value);
    }
    if (entry.label) {
      customByLabel.set(entry.label.toLowerCase(), entry.value);
    }
  });

  const fields: MetadataField[] = [];
  config.forEach(({ id, label }) => {
    const normalised = (id || "").trim();
    if (!normalised) {
      return;
    }

    let value: string | number | null = null;
    if (BUILT_INS.has(normalised.toLowerCase())) {
      value = resolveBuiltInValue(normalised.toLowerCase(), data, enableDpiView, enableDetailedView);
    } else {
      value = customByKey.get(normalised) ?? customByLabel.get(label.toLowerCase()) ?? null;
    }

    if (value !== null && value !== undefined && String(value).length > 0) {
      fields.push({ label: label || normalised, value });
    }
  });

  return fields;
};

export const QuickViewModal: FC<QuickViewModalProps> = ({ asset, onClose }) => {
  const { __ } = useTranslation();
  const { apiBase, enableDpiView, enableDetailedView, quickViewMetadata } = useConfiguration();
  const initialData = asset.data;
  const [detail, setDetail] = useState<AssetItem["data"] | null>(initialData || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const path = initialData?.realPath || initialData?.path;
    if (!path) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchJson<Asset>(assetUrl(apiBase, path))
      .then((response) => {
        if (cancelled) return;
        const mapped = mapAsset(response);
        if (mapped.data) {
          setDetail(mapped.data);
        }
      })
      .catch(() => {
        // Keep the listing payload when detail fetch fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase, initialData?.path, initialData?.realPath]);

  const metadata = useMemo((): MetadataField[] => {
    if (!detail) return [];

    if (Array.isArray(quickViewMetadata) && quickViewMetadata.length > 0) {
      return configuredFields(detail, quickViewMetadata, enableDpiView, enableDetailedView);
    }

    return legacyFields(detail, enableDpiView, enableDetailedView, __);
  }, [detail, quickViewMetadata, enableDpiView, enableDetailedView, __]);

  if (!detail) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${detail.name}`}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Quick View</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close quick view">
            <AiOutlineClose />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.previewSection}>
            <div className={styles.previewImageWrap}>
              <AssetImage
                src={detail.thumbnail?.url}
                fallbackSrc={detail.realPath || detail.path}
                alt={detail.name}
                name={detail.name}
                mime={detail.mime}
                className={styles.previewImage}
              />
            </div>
            <div className={styles.previewInfo}>
              <p className={styles.previewFileName}>{detail.name}</p>
            </div>
          </div>

          {loading && metadata.length === 0 ? (
            <p className={styles.previewFileName}>Loading…</p>
          ) : (
            metadata.length > 0 && (
              <div className={styles.tableContainer}>
                <table className={styles.metaTable}>
                  <thead>
                    <tr>
                      <th className={styles.thField}>Field</th>
                      <th className={styles.thValue}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map(({ label, value }) => (
                      <tr key={label} className={styles.tableRow}>
                        <td className={styles.fieldLabel}>{label}</td>
                        <td className={styles.fieldValue}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
