import { Filter, MultiValueFilter } from "../../models/filter";

export const isMultiValueFilter = (filter: Filter): filter is MultiValueFilter => {
  return filter.type === "checkbox" || filter.type === "multiselect";
};
