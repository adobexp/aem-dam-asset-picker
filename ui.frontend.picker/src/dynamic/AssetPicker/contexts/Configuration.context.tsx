import { createContext, FC, PropsWithChildren, useContext } from "react";

import { Filter } from "../models/filter";
import { PickerParams, PickerSelectionMode, PickerViewMode } from "../models/picker";
import { QuickViewMetadataField } from "../models/quickView";
import { SearchBoxAlignment } from "../models/search";
import { SortParam } from "../models/sort";
import { Theme } from "../models/theme";
import { ViewMode } from "../models/viewMode";

export type Configuration = {
  /** Base path of the GET APIs, e.g. `/bin/asset-picker`. */
  apiBase: string;
  /** @deprecated kept for transitional callers; prefer `apiBase`. */
  apiPath?: string | null;
  rootLabel?: string;
  rootDirectories: string[];
  shareUrl?: string | null;
  displayDirectoryNames?: boolean;
  theme?: Theme;
  viewMode?: ViewMode;
  collections?: boolean;
  newTab?: boolean;
  filters?: Filter[];
  /** Authored Quick View rows; empty / absent keeps the legacy default field set. */
  quickViewMetadata?: QuickViewMetadataField[];
  sort?: SortParam[];
  showSearch?: boolean;
  searchPageSize?: number;
  collapsibleFilters?: boolean;
  metadataView?: "horizontal" | "vertical";
  enableTypes?: boolean;
  enableDpiView?: boolean;
  enableDetailedView?: boolean;
  enableDirectDownload?: boolean;
  enableDirectorySidebarCollapse?: boolean;
  hideMilliSeconds?: boolean;
  showActionIcons?: boolean;
  semanticSearchEnabled?: boolean;
  fuzzySearchEnabled?: boolean;
  showSemanticSearch?: boolean;
  showFuzzySearch?: boolean;
  defaultSemanticState?: boolean;
  defaultFuzzyState?: boolean;
  isOmniSearchEnable?: boolean;
  tenantSearchPath?: string;
  searchBoxAlignment?: SearchBoxAlignment;
  selectionMode?: PickerSelectionMode;
  pickerViewMode?: PickerViewMode;
  targetOrigin?: string;
  /** Query-string params merged over the authored config for this launch. */
  pickerParams?: PickerParams;
};

const defaults: Configuration = {
  apiBase: "/bin/asset-picker",
  apiPath: null,
  rootDirectories: [],
  shareUrl: null,
  displayDirectoryNames: false,
  collections: false,
  newTab: true,
  showSearch: true,
  searchPageSize: 100,
  collapsibleFilters: false,
  enableTypes: false,
  enableDpiView: false,
  enableDetailedView: false,
  enableDirectDownload: false,
  enableDirectorySidebarCollapse: true,
  hideMilliSeconds: false,
  showActionIcons: false,
  semanticSearchEnabled: false,
  fuzzySearchEnabled: false,
  showSemanticSearch: true,
  showFuzzySearch: true,
  defaultSemanticState: false,
  defaultFuzzyState: false,
  isOmniSearchEnable: false,
  selectionMode: "multiple",
  pickerViewMode: "browse",
  targetOrigin: "*",
  pickerParams: {},
};

export const ConfigurationContext = createContext<Configuration>(defaults);

export const ConfigurationProvider: FC<PropsWithChildren<{ configuration: Configuration }>> = ({
  configuration,
  children,
}) => {
  const config: Configuration = {
    ...defaults,
    ...configuration,
    showSearch: configuration.showSearch ?? true,
    searchPageSize: configuration.searchPageSize ?? 100,
    collapsibleFilters: configuration.collapsibleFilters ?? false,
    metadataView: configuration.metadataView ?? "horizontal",
    enableTypes: configuration.enableTypes ?? false,
    enableDpiView: configuration.enableDpiView ?? false,
    enableDetailedView: configuration.enableDetailedView ?? false,
    enableDirectDownload: configuration.enableDirectDownload ?? false,
    enableDirectorySidebarCollapse: configuration.enableDirectorySidebarCollapse ?? true,
    hideMilliSeconds: configuration.hideMilliSeconds ?? false,
    showActionIcons: configuration.showActionIcons ?? false,
    semanticSearchEnabled: configuration.semanticSearchEnabled ?? false,
    fuzzySearchEnabled: configuration.fuzzySearchEnabled ?? false,
    showSemanticSearch: configuration.showSemanticSearch ?? true,
    showFuzzySearch: configuration.showFuzzySearch ?? true,
    defaultSemanticState: configuration.defaultSemanticState ?? false,
    defaultFuzzyState: configuration.defaultFuzzyState ?? false,
    isOmniSearchEnable: configuration.isOmniSearchEnable ?? false,
    selectionMode: configuration.selectionMode ?? "multiple",
    pickerViewMode: configuration.pickerViewMode ?? "browse",
    targetOrigin: configuration.targetOrigin ?? "*",
    pickerParams: configuration.pickerParams ?? {},
    apiBase: configuration.apiBase || configuration.apiPath || defaults.apiBase,
  };

  // Mock mode keeps the authored DAM paths (e.g. `/content/dam/picker`) so the flat
  // fixture naming in `apiClient.assetsUrl` can resolve them. No rewrite needed.

  return <ConfigurationContext.Provider value={config}>{children}</ConfigurationContext.Provider>;
};

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
