import { Filter, FilterValue, parseDateRange } from "../../models/filter";

import { isMultiValueFilter } from "./isMultiValueFilter";

export const getSelectedValues = (filter: Filter): FilterValue[] => {
  if (isMultiValueFilter(filter)) {
    return filter.value
      .map((valueId) => {
        return filter.values.find(({ id }) => id === valueId);
      })
      .filter((value): value is FilterValue => value !== undefined);
  }

  if (filter.type === "text") {
    return filter.value ? [{ id: filter.id, name: filter.value }] : [];
  }

  if (filter.type === "daterange") {
    if (!filter.value) {
      return [];
    }
    const { from, to } = parseDateRange(filter.value);
    const label = [from, to].filter(Boolean).join(" - ");
    return label ? [{ id: filter.value, name: label }] : [];
  }

  const selectedValue = filter.values?.find(({ id }) => id === filter.value);
  return selectedValue ? [selectedValue] : [];
};
