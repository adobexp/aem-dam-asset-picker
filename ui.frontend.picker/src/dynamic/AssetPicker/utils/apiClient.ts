import { PickerParams } from "../models/picker";

import { pickerParamsToQuery } from "./parsePickerParams";

const MOCK_API_BASE = "/api/asset-picker";

const isMockMode = () => process.env.API === "mock";

/**
 * Mock fixtures are plain static files with no query string support, so the DAM path
 * is folded into the filename: `/content/dam/picker/brand` becomes
 * `content_dam_picker_brand.json`.
 */
const fixtureName = (path: string): string =>
  path.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\//g, "_") || "root";

const merge = (target: URLSearchParams, source: URLSearchParams) => {
  source.forEach((value, key) => target.append(key, value));
  return target;
};

export type SortRequest = {
  sortId?: string;
  sortOrder?: string;
};

export type SearchRequest = {
  path: string;
  page: number;
  pageSize: number;
  search?: string;
  files: boolean;
  folders: boolean;
  semanticSearchEnabled: boolean;
  fuzzySearchEnabled: boolean;
  /** Sidebar filters, as `[{ property, values }]`. */
  filters: Array<Record<string, string | string[]>>;
} & SortRequest;

/** Folder listing: children folders and assets of `path`. */
export const assetsUrl = (apiBase: string, path: string, sort: SortRequest, pickerParams: PickerParams): string => {
  if (isMockMode()) {
    return `${MOCK_API_BASE}/assets/${fixtureName(path)}.json`;
  }

  const query = new URLSearchParams({ path });
  if (sort.sortId) {
    query.set("sort", sort.sortId);
    if (sort.sortOrder) {
      query.set("sortOrder", sort.sortOrder);
    }
  }

  return `${apiBase}/assets.json?${merge(query, pickerParamsToQuery(pickerParams))}`;
};

/** Paginated search within `path`. */
export const searchUrl = (apiBase: string, request: SearchRequest, pickerParams: PickerParams): string => {
  if (isMockMode()) {
    return `${MOCK_API_BASE}/search/${request.page}.json`;
  }

  const query = new URLSearchParams({
    path: request.path,
    page: String(request.page),
    pageSize: String(request.pageSize),
    files: String(request.files),
    folders: String(request.folders),
  });

  if (request.search) {
    query.set("q", request.search);
  }
  if (request.semanticSearchEnabled) {
    query.set("semantic", "true");
  }
  if (request.fuzzySearchEnabled) {
    query.set("fuzzy", "true");
  }
  if (request.sortId) {
    query.set("sort", request.sortId);
    if (request.sortOrder) {
      query.set("sortOrder", request.sortOrder);
    }
  }
  // Sidebar filters travel as repeated `filter.<property>=<value>` pairs, the same shape
  // the host page can use on the picker URL, so the servlet has a single code path.
  // Date ranges use `range.<property>=from..to` so they cannot be confused with equality filters.
  request.filters.forEach((filter) => {
    const property = String(filter.property);
    const values = Array.isArray(filter.values) ? filter.values : [filter.values];
    const isRange = filter.type === "daterange";
    values.forEach((value) => {
      query.append(`${isRange ? "range" : "filter"}.${property}`, String(value));
    });
  });

  return `${apiBase}/search.json?${merge(query, pickerParamsToQuery(pickerParams))}`;
};

/** Filter definitions and facet counts for `path`. */
export const filtersUrl = (apiBase: string, path: string): string => {
  if (isMockMode()) {
    return `${MOCK_API_BASE}/filters.json`;
  }
  return `${apiBase}/filters.json?${new URLSearchParams({ path })}`;
};

/** Single asset detail, used by the quick view. */
export const assetUrl = (apiBase: string, path: string): string => {
  if (isMockMode()) {
    return `${MOCK_API_BASE}/asset/${fixtureName(path)}.json`;
  }
  return `${apiBase}/asset.json?${new URLSearchParams({ path })}`;
};

/**
 * All picker endpoints are read-only GETs, which keeps the client free of CSRF token
 * round-trips. Credentials are included so an authenticated AEM session is reused.
 */
export const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Asset Picker API request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
};
