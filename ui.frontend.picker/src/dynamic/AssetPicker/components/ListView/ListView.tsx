import React, { forwardRef, useMemo } from "react";
import { FaFolder } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import classNames from "classnames";

import { useTranslation } from "../../contexts/I18n.context";
import { useConfiguration } from "../../contexts/Configuration.context";
import { useSelection } from "../../contexts/Selection.context";
import { AssetItem, DirectoryItem } from "../../models/directoryStructure";
import { isAsset } from "../../utils/isAsset";

import styles from "./ListView.module.scss";

type ListViewProps = {
  assets: (DirectoryItem | AssetItem)[];
};

type VirtualizedRowProps = {
  index: number;
  style: React.CSSProperties;
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

/**
 * Breathing room around virtualized rows so hover border + shadow aren't clipped
 * at the top OR right/left edges of the react-window viewport.
 */
const LIST_EDGE_PAD_Y = 12;
const LIST_EDGE_PAD_X = 14;

const ListInner = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }>(
  ({ style, ...rest }, ref) => (
    <div
      ref={ref}
      style={{
        ...style,
        height: style?.height != null ? `${Number(style.height) + LIST_EDGE_PAD_Y * 2}px` : style?.height,
        width: style?.width != null ? `${Number(style.width) + LIST_EDGE_PAD_X * 2}px` : style?.width,
        paddingTop: LIST_EDGE_PAD_Y,
        paddingBottom: LIST_EDGE_PAD_Y,
        paddingLeft: LIST_EDGE_PAD_X,
        paddingRight: LIST_EDGE_PAD_X,
        boxSizing: "content-box",
      }}
      {...rest}
    />
  ),
);
ListInner.displayName = "ListInner";

type ThumbProps = {
  src: string;
  alt: string;
  isRestricted: boolean;
};

const PreviewThumb: React.FC<ThumbProps> = ({ src, alt, isRestricted }) => {
  const imgEl = React.createElement("img", {
    src,
    alt,
    className: styles.previewImage,
  });

  const lockEl = isRestricted
    ? React.createElement(
        "span",
        { className: styles.previewLock, "aria-hidden": "true" },
        React.createElement(FiLock, { size: 12 }),
      )
    : null;

  return React.createElement(
    "div",
    {
      className: classNames(styles.previewWrap, {
        [styles.previewRestricted]: isRestricted,
      }),
    },
    imgEl,
    lockEl,
  );
};

export const ListView: React.FC<ListViewProps> = ({ assets }) => {
  const { __ } = useTranslation();
  const { enableDpiView, enableDetailedView } = useConfiguration();
  const { toggleAsset, isSelected, selectionMode } = useSelection();
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<DirectoryItem | AssetItem>[]>(
    () => [
      /* ─────────── SELECT ─────────── */
      {
        accessorKey: "select",
        header: __("assetPicker.select") || "Select",
        enableResizing: false,
        size: 80,
        cell: ({ row }) => {
          const asset = row.original;
          if (!asset.data || !isAsset(asset)) {
            return <span className={styles.cellMuted}>—</span>;
          }

          const metaArr = Array.isArray(asset.data.metadata) ? (asset.data.metadata as MetadataEntry[]) : [];
          const status = getMetaByLabel(metaArr, "status")?.value;
          const isRestricted = status?.toLowerCase() === "restricted";

          if (isRestricted) {
            return <span className={styles.cellMuted}>—</span>;
          }

          const selected = isSelected(asset.data.realPath);

          return (
            <input
              type={selectionMode === "single" ? "radio" : "checkbox"}
              className={styles.selectControl}
              checked={selected}
              onChange={() => toggleAsset(asset)}
              onClick={(event) => event.stopPropagation()}
              aria-label={`${__("assetPicker.select") || "Select"} ${asset.data.name}`}
              data-no-row-nav
            />
          );
        },
      },

      /* ─────────── PREVIEW ─────────── */
      {
        accessorKey: "preview",
        header: __("directoryExplorer.preview") || "Preview",
        enableResizing: false,
        size: 120,
        cell: ({ row }) => {
          const asset = row.original;
          if (!asset.data) return null;
          const { path, name, thumbnail } = asset.data;

          if (isAsset(asset)) {
            const { thumbnail: assetThumb, metadata } = asset.data;
            const metaArr = Array.isArray(metadata) ? (metadata as MetadataEntry[]) : [];
            const status = getMetaByLabel(metaArr, "status")?.value;
            const isRestricted = status?.toLowerCase() === "restricted";

            return (
              <div className={styles.imageWrapper}>
                <PreviewThumb src={assetThumb.url} alt={name} isRestricted={Boolean(isRestricted)} />
              </div>
            );
          }

          /* Directory item */
          return (
            <Link to={{ pathname: path }} className={styles.imageWrapper}>
              <div
                className={classNames(styles.iconWrapper, {
                  [styles.withThumbnail]: thumbnail !== undefined,
                })}
                style={
                  thumbnail?.url ? ({ "--folder-bg": `url("${thumbnail.url}")` } as React.CSSProperties) : undefined
                }
              >
                <FaFolder size={32} className={styles.icon} />
              </div>
            </Link>
          );
        },
      },

      /* ─────────── NAME ─────────── */
      {
        accessorKey: "name",
        header: __("directoryExplorer.assetName") || "Name",
        cell: ({ row }) => {
          const asset = row.original;
          if (!asset.data) return null;

          const metaArr =
            isAsset(asset) && Array.isArray(asset.data.metadata) ? (asset.data.metadata as MetadataEntry[]) : [];
          const titleFromMeta = getMetaByLabel(metaArr, "title")?.value;
          const displayTitle = titleFromMeta || asset.data.name || "";
          const status = getMetaByLabel(metaArr, "status")?.value;
          const isRestricted = status?.toLowerCase() === "restricted";

          return (
            <div className={styles.nameCell}>
              {status && (
                <span
                  className={classNames(styles.statusChip, {
                    [styles.statusChipRestricted]: isRestricted,
                  })}
                >
                  {status}
                </span>
              )}
              <span className={styles.nameText} title={displayTitle.length > 40 ? displayTitle : undefined}>
                {displayTitle}
              </span>
            </div>
          );
        },
      },

      /* ─────────── FILE TYPE ─────────── */
      {
        accessorKey: "fileType",
        header: __("directoryExplorer.fileType") || "File type",
        enableResizing: false,
        size: 140,
        cell: ({ row }) => {
          const asset = row.original;
          if (!isAsset(asset) || !asset.data) {
            return <span className={styles.cellMuted}>—</span>;
          }
          return <span className={styles.cellValue}>{formatMime(asset.data.mime)}</span>;
        },
      },

      /* ─────────── DIMENSION / RESOLUTION ─────────── */
      {
        accessorKey: "resolution",
        header: enableDpiView
          ? __("directoryExplorer.assetDpi") || "DPI"
          : __("directoryExplorer.assetResolution") || "Resolution",
        enableResizing: false,
        size: 160,
        cell: ({ row }) => {
          const asset = row.original;
          if (!isAsset(asset) || !asset.data?.resolution) {
            return <span className={styles.cellMuted}>—</span>;
          }
          const { dpi, width, height, dimensions } = asset.data.resolution;

          if (enableDpiView) {
            return dpi > 0 ? (
              <span className={styles.cellValue}>{dpi}</span>
            ) : (
              <span className={styles.cellMuted}>—</span>
            );
          }
          if (dimensions) {
            return <span className={styles.cellValue}>{dimensions}</span>;
          }
          if (width > 0 && height > 0) {
            return (
              <span className={styles.cellValue}>
                {width} x {height}
              </span>
            );
          }
          return <span className={styles.cellMuted}>—</span>;
        },
      },

      /* ─────────── SIZE ─────────── */
      {
        accessorKey: "size",
        header: enableDetailedView
          ? __("directoryExplorer.assetFilesize") || "File size"
          : __("directoryExplorer.assetSize") || "Size",
        enableResizing: false,
        size: 120,
        cell: ({ row }) => {
          const asset = row.original;
          if (!isAsset(asset)) {
            return <span className={styles.cellMuted}>—</span>;
          }
          return <span className={styles.cellValue}>{asset.data?.size || "—"}</span>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [__, enableDpiView, enableDetailedView, isSelected, selectionMode, toggleAsset],
  );

  const table = useReactTable({
    data: assets,
    columns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
  });

  const VirtualizedRow: React.FC<VirtualizedRowProps> = React.memo(({ index, style }) => {
    const row = table.getRowModel().rows[index];
    const asset = row.original;
    const metaArr =
      isAsset(asset) && asset.data && Array.isArray(asset.data.metadata)
        ? (asset.data.metadata as MetadataEntry[])
        : [];
    const status = getMetaByLabel(metaArr, "status")?.value;
    const isRestricted = status?.toLowerCase() === "restricted";
    const selected = isAsset(asset) && asset.data ? isSelected(asset.data.realPath) : false;

    const handleRowClick = (ev: React.MouseEvent<HTMLDivElement>) => {
      if (isRestricted) return;
      const target = ev.target as HTMLElement;
      if (target.closest("button, a, input, [data-no-row-nav]")) return;
      if (!asset.data) return;

      // Clicking an asset row picks it; clicking a folder row descends into it.
      if (isAsset(asset)) {
        toggleAsset(asset);
      } else {
        navigate(asset.data.path);
      }
    };

    const handleRowKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (isRestricted) return;
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        handleRowClick(ev as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        key={row.id}
        className={classNames(styles.tableRow, {
          [styles.tableRowRestricted]: Boolean(isRestricted),
          [styles.tableRowClickable]: !isRestricted,
          [styles.tableRowSelected]: selected,
        })}
        style={{
          ...style,
          // Match ListInner padding so hover border/shadow stay inside the scrollport
          top: Number(style.top ?? 0) + LIST_EDGE_PAD_Y,
          left: Number(style.left ?? 0) + LIST_EDGE_PAD_X,
          width: `calc(100% - ${LIST_EDGE_PAD_X * 2}px)`,
          display: "flex",
        }}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        role={!isRestricted ? "button" : undefined}
        tabIndex={!isRestricted ? 0 : -1}
        aria-disabled={isRestricted}
        aria-pressed={selected}
      >
        {row.getVisibleCells().map((cell) => (
          <div
            key={cell.id}
            className={styles.rowCell}
            style={{
              width: cell.column.getSize(),
              flexShrink: 0,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    );
  });

  return (
    <div className={styles.tableContainer}>
      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            width: `max(100%, ${table.getTotalSize() + LIST_EDGE_PAD_X * 2}px)`,
            height: "100%",
            minWidth: "100%",
          }}
        >
          <div
            className={styles.tableHeader}
            style={{
              display: "flex",
              width: `calc(max(100%, ${table.getTotalSize()}px) - 0em)`,
              marginLeft: LIST_EDGE_PAD_X,
              marginRight: LIST_EDGE_PAD_X,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {table.getHeaderGroups()[0].headers.map((header) => (
              <div
                key={header.id}
                className={styles.tableHeaderCell}
                style={{
                  width: header.getSize(),
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={classNames(styles.resizer, {
                      [styles.isResizing]: header.column.getIsResizing(),
                    })}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <div className={styles.tableBodyContainer}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={table.getRowModel().rows.length}
                  itemSize={96}
                  width={Math.max(width, table.getTotalSize())}
                  innerElementType={ListInner}
                  style={{ overflowX: "auto", overflowY: "auto" }}
                >
                  {VirtualizedRow}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>
    </div>
  );
};
