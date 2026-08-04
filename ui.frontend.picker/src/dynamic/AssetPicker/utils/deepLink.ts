const APP_QUERY_PARAM = "path";
const ASSET_PATH_QUERY_PARAM = "assetPath";

const buildSearchWithAssetPath = (search: string, assetPath: string): string => {
  const searchParams = new URLSearchParams(search);
  searchParams.set(ASSET_PATH_QUERY_PARAM, assetPath);
  const nextSearch = searchParams.toString();
  return nextSearch ? `?${nextSearch}` : "";
};

export const buildTenantAssetDetailsHref = (detailsRoute: string, assetPath: string): string => {
  const pageUrl = new URL(window.location.href);
  const hasTenantAppParam = pageUrl.searchParams.has(APP_QUERY_PARAM);
  const nextSearch = hasTenantAppParam ? buildSearchWithAssetPath(pageUrl.search, assetPath) : pageUrl.search;
  return `${window.location.pathname}${nextSearch}#${detailsRoute}`;
};

export const syncTenantAssetPathParam = (assetPath: string | null): void => {
  const pageUrl = new URL(window.location.href);

  if (!pageUrl.searchParams.has(APP_QUERY_PARAM)) {
    return;
  }

  if (assetPath) {
    pageUrl.searchParams.set(ASSET_PATH_QUERY_PARAM, assetPath);
  } else {
    pageUrl.searchParams.delete(ASSET_PATH_QUERY_PARAM);
  }

  history.replaceState({}, "", pageUrl);
};
