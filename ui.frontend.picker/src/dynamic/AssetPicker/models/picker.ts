import { Theme } from "./theme";

/**
 * The asset payload handed back to the host page. The field names and types are the
 * OOTB AEM Asset Picker contract and must not be changed: existing consumers read
 * exactly these keys off each entry of the `data` array.
 */
export type PickerAsset = {
  path: string;
  url: string;
  type: string;
  title: string;
  size: string;
  img?: string;
};

export type PickerSelectionMode = "single" | "multiple";

export type PickerViewMode = "browse" | "search";

/**
 * The parameters a host page may pass on the picker URL. Everything is optional:
 * unset values fall back to the Sling `data-config` defaults.
 */
export type PickerParams = {
  /** Light / dark; from the `theme` query parameter on the selector URL. */
  theme?: Theme;
  selectionMode?: PickerSelectionMode;
  rootDirectory?: string;
  mimeTypes?: string[];
  assetTypes?: string[];
  pickerViewMode?: PickerViewMode;
  solution?: string;
  requiredProperties?: string[];
  targetOrigin?: string;
  /** Bespoke metadata filters, from `filter.<property>=<value>` query parameters. */
  metadataFilters?: Record<string, string[]>;
};
