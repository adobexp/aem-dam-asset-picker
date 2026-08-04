type MimeType = string;

export type AssetMetadata = {
  label: string;
  value: string;
  /** Normalised metadata property key when provided by the API. */
  key?: string;
};

export type Directory = {
  type: "directory";
  name: string;
  isLeaf: boolean;
  path: string;
  items: Array<Directory | Asset>;
  thumbnail: {
    url: string;
  };
  total: number;
  displayed: number;
  time: number;
  sequenceOrder?: number;
  childrenCount?: number;
};

export type Asset = {
  type: "asset";
  path: string;
  name: string;
  mime: MimeType;
  resolution: {
    width: number;
    height: number;
    dpi?: number;
    dimensions?: string;
  };
  size: string;
  detailsUrl?: string;
  thumbnail: {
    url: string;
  };
  originalDownloadUrl: string;
  renditionDownloadUrl: string;
  downloadEnabled: boolean;
  shareEnabled: boolean;
  cartEnabled: boolean;
  sequenceOrder?: number;
  metadata?: AssetMetadata[];
};
