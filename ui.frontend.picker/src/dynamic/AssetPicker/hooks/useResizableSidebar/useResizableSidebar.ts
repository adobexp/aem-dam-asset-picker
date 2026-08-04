import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "assetBrowser.sidebarWidth";
const DEFAULT_WIDTH = 303;

type UseResizableSidebar = ({
  sidebarRef,
  minWidth,
  maxWidth,
  side,
  storageKey,
}: {
  sidebarRef: React.RefObject<HTMLElement | null>;
  minWidth: number;
  maxWidth: number | (() => number);
  side?: "left" | "right";
  storageKey?: string;
}) => {
  handleResizeMouseDown: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  isResizing: boolean;
  sidebarWidth: number;
};

const readStoredWidth = (minWidth: number, maxWidth: number, storageKey: string): number => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw == null || raw === "") {
      return DEFAULT_WIDTH;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_WIDTH;
    }
    return Math.min(maxWidth, Math.max(minWidth, Math.round(parsed)));
  } catch {
    return DEFAULT_WIDTH;
  }
};

const persistWidth = (width: number, storageKey: string) => {
  try {
    localStorage.setItem(storageKey, String(width));
  } catch {
    /* private mode / quota — ignore */
  }
};

export const useResizableSidebar: UseResizableSidebar = ({
  sidebarRef: _sidebarRef,
  minWidth,
  maxWidth,
  side = "left",
  storageKey = STORAGE_KEY,
}) => {
  void _sidebarRef;
  const getMaxSidebarWidth = useCallback(() => {
    return typeof maxWidth === "function" ? maxWidth() : maxWidth;
  }, [maxWidth]);

  const [maxSidebarWidth, setMaxSidebarWidth] = useState(() => getMaxSidebarWidth());
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    readStoredWidth(minWidth, getMaxSidebarWidth(), storageKey),
  );
  const [isResizing, setIsResizing] = useState(false);

  useEffect(
    function calculateSidebarWidthOnResize() {
      const handleResize = () => {
        const width = getMaxSidebarWidth();
        setMaxSidebarWidth(width);
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [getMaxSidebarWidth],
  );

  useEffect(
    function limitSidebarSize() {
      if (sidebarWidth > maxSidebarWidth) {
        const next = Math.max(minWidth, maxSidebarWidth);
        setSidebarWidth(next);
        persistWidth(next, storageKey);
      }
    },
    [sidebarWidth, minWidth, maxSidebarWidth, storageKey],
  );

  const normalizeWidth = useCallback(
    (width: number, max: number): number => {
      return Math.min(max, Math.max(minWidth, Math.round(width)));
    },
    [minWidth],
  );

  const handleResizeMouseDown = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Allow resize even if content ref is momentarily unset — width is driven by state/CSS var.
    if (ev.button !== 0) {
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();

    const startX = ev.clientX;
    const startWidth = sidebarWidth;
    const max = getMaxSidebarWidth();

    setIsResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const mouseMoveHandler = (moveEv: MouseEvent) => {
      moveEv.preventDefault();
      const dx = side === "left" ? moveEv.clientX - startX : startX - moveEv.clientX;
      setSidebarWidth(normalizeWidth(startWidth + dx, max));
    };

    const mouseUpHandler = (upEv: MouseEvent) => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);

      const dx = side === "left" ? upEv.clientX - startX : startX - upEv.clientX;
      const finalWidth = normalizeWidth(startWidth + dx, max);
      setSidebarWidth(finalWidth);
      persistWidth(finalWidth, storageKey);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  return {
    handleResizeMouseDown,
    isResizing,
    sidebarWidth,
  };
};
