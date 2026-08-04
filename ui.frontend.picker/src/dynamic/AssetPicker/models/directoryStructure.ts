import { SortOrder } from "./sort";

export type ChildPath = {
  path: string;
  sequenceOrder?: number;
};

export type DirectoryData = {
  path: string;
  name: string;
  expanded: boolean;
  type: "directory";
  leaf: boolean;
  level: number;
  childPaths: ChildPath[];
  thumbnail?: { url: string };
  sortId?: string;
  sortOrder?: SortOrder;
  childrenCount?: number;
};

export type DirectoryItem =
  | {
      loading: true;
      data?: DirectoryData;
    }
  | {
      loading: false;
      data: DirectoryData;
    }
  | {
      loading: false;
      data?: DirectoryData;
      error: true;
    };

export type AssetData = {
  path: string;
  realPath: string;
  name: string;
  type: "asset";
  mime: string;
  resolution: { width: number; height: number; dpi: number; dimensions: string };
  size: string;
  /** Public delivery URL — used in the OOTB postMessage payload. */
  url?: string;
  /** Display title — falls back to `name` when absent. */
  title?: string;
  detailsUrl?: string;
  thumbnail: { url: string };
  originalDownloadUrl?: string;
  renditionDownloadUrl?: string;
  downloadEnabled?: boolean;
  shareEnabled?: boolean;
  cartEnabled?: boolean;
  metadata?: { label: string; value: string; key?: string }[];
};

export type AssetItem =
  | { loading: true; data?: AssetData }
  | {
      loading: false;
      data: AssetData;
    };

export type DirectoryStructure = {
  [path: string]: DirectoryItem | AssetItem;
};
