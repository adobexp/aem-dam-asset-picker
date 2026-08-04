import { PickerParams, PickerSelectionMode, PickerViewMode } from "../models/picker";
import { Theme, themes } from "../models/theme";

const SELECTION_MODES: PickerSelectionMode[] = ["single", "multiple"];
const VIEW_MODES: PickerViewMode[] = ["browse", "search"];

const METADATA_FILTER_PREFIX = "filter.";

/** Splits a comma separated parameter and drops the empty entries. */
const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

/**
 * Collects every value of a repeatable parameter, accepting both the repeated form
 * (`?mimetype=image/png&mimetype=image/jpeg`) and the comma separated form
 * (`?mimetype=image/png,image/jpeg`) that some hosts use.
 */
const collectList = (params: URLSearchParams, name: string): string[] | undefined => {
  const values = params.getAll(name).flatMap(splitList);
  return values.length > 0 ? Array.from(new Set(values)) : undefined;
};

const first = (params: URLSearchParams, name: string): string | undefined => {
  const value = params.get(name);
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Reads the OOTB AEM Asset Picker query parameters, plus the bespoke `filter.<property>`
 * extension, off a query string. Unknown or malformed values are ignored rather than
 * throwing, so a bad URL degrades to the configured defaults instead of a blank picker.
 */
export const parsePickerParams = (search: string = window.location.search): PickerParams => {
  const params = new URLSearchParams(search);
  const parsed: PickerParams = {};

  const theme = first(params, "theme")?.toLowerCase();
  if (theme && themes.includes(theme as Theme)) {
    parsed.theme = theme as Theme;
  }

  const mode = first(params, "mode")?.toLowerCase();
  if (mode && SELECTION_MODES.includes(mode as PickerSelectionMode)) {
    parsed.selectionMode = mode as PickerSelectionMode;
  }

  const viewMode = first(params, "viewmode")?.toLowerCase();
  if (viewMode && VIEW_MODES.includes(viewMode as PickerViewMode)) {
    parsed.pickerViewMode = viewMode as PickerViewMode;
  }

  const root = first(params, "root");
  if (root) {
    parsed.rootDirectory = root;
  }

  const mimeTypes = collectList(params, "mimetype");
  if (mimeTypes) {
    parsed.mimeTypes = mimeTypes;
  }

  const assetTypes = collectList(params, "assettype");
  if (assetTypes) {
    parsed.assetTypes = assetTypes;
  }

  const requiredProperties = collectList(params, "requiredproperty");
  if (requiredProperties) {
    parsed.requiredProperties = requiredProperties;
  }

  const solution = first(params, "solution");
  if (solution) {
    parsed.solution = solution;
  }

  const targetOrigin = first(params, "targetorigin");
  if (targetOrigin) {
    parsed.targetOrigin = targetOrigin;
  }

  const metadataFilters: Record<string, string[]> = {};
  params.forEach((value, key) => {
    if (!key.startsWith(METADATA_FILTER_PREFIX)) {
      return;
    }

    const property = key.slice(METADATA_FILTER_PREFIX.length);
    const values = splitList(value);
    if (!property || values.length === 0) {
      return;
    }

    metadataFilters[property] = [...(metadataFilters[property] ?? []), ...values];
  });

  if (Object.keys(metadataFilters).length > 0) {
    parsed.metadataFilters = metadataFilters;
  }

  return parsed;
};

/**
 * Serialises picker params back onto the API query string so the backend applies the
 * same restrictions the host page asked for.
 */
export const pickerParamsToQuery = (params: PickerParams): URLSearchParams => {
  const query = new URLSearchParams();

  params.mimeTypes?.forEach((mimeType) => query.append("mimetype", mimeType));
  params.assetTypes?.forEach((assetType) => query.append("assettype", assetType));
  params.requiredProperties?.forEach((property) => query.append("requiredproperty", property));

  if (params.solution) {
    query.set("solution", params.solution);
  }

  Object.entries(params.metadataFilters ?? {}).forEach(([property, values]) => {
    values.forEach((value) => query.append(`${METADATA_FILTER_PREFIX}${property}`, value));
  });

  return query;
};
