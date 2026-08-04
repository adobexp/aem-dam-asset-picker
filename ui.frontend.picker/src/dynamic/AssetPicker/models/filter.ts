export const FILTER_PARAM = "filters";

export type FilterValue = {
  id: string;
  name: string;
};

export type SelectedFilterOption = {
  filterId: string;
  filterName: string;
  valueId: string;
  valueName: string;
};

type FilterCommon = {
  id: string;
  expanded: boolean;
  name: string;
  dependsOn?: string;
  categoryValues?: {};
  searchable?: boolean;
  placeholder?: string;
  multiSelect?: boolean;
};

export type MultiValueFilter = FilterCommon &
  (
    | {
        type: "checkbox";
        value: string[];
        values: FilterValue[];
      }
    | {
        type: "multiselect";
        value: string[];
        values: FilterValue[];
      }
  );

export type SingleValueFilter = FilterCommon &
  (
    | {
        type: "text";
        value: string | null;
      }
    | {
        type: "radio";
        value: string | null;
        values: FilterValue[];
      }
    | {
        type: "select";
        value: string | null;
        values: FilterValue[];
      }
    | {
        /** Encoded as `from..to` with either side optional (e.g. `2024-01-01..` or `..2024-12-31`). */
        type: "daterange";
        value: string | null;
      }
  );

export type Filter = SingleValueFilter | MultiValueFilter;

/** Splits a daterange value into from/to parts. */
export const parseDateRange = (value: string | null | undefined): { from: string; to: string } => {
  if (!value) {
    return { from: "", to: "" };
  }
  const separator = value.indexOf("..");
  if (separator < 0) {
    return { from: value, to: "" };
  }
  return {
    from: value.slice(0, separator),
    to: value.slice(separator + 2),
  };
};

/** Joins from/to into the encoded daterange value, or null when both empty. */
export const formatDateRange = (from: string, to: string): string | null => {
  const f = from.trim();
  const t = to.trim();
  if (!f && !t) {
    return null;
  }
  return `${f}..${t}`;
};
