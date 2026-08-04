import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useConfiguration } from "../../contexts/Configuration.context";
import { Filter as FilterModel, FILTER_PARAM, SelectedFilterOption } from "../../models/filter";

import { getSelectedValues } from "./getSelectedValues";
import { isMultiValueFilter } from "./isMultiValueFilter";

type UrlFilter = Pick<FilterModel, "id" | "value">;

/** Batch of filter updates — used by changeFilters() to apply many at once
 *  without sequential closure races. */
export type FilterChange = {
  id: string;
  value: null | string | string[];
};

export const useFilters = () => {
  const { filters: filtersConfig = [] } = useConfiguration();

  const [searchParams, setSearchParams] = useSearchParams();
  const filterSearchParam = searchParams.get(FILTER_PARAM);

  const [filters, setFilters] = useState<FilterModel[]>(() => {
    const cachedFilters: UrlFilter[] = filterSearchParam ? JSON.parse(filterSearchParam) : [];
    return filtersConfig.map((filter) => {
      const expanded = filter.expanded ?? false;

      const cachedFilter = cachedFilters.find(({ id }) => id === filter.id);
      const cachedValue = cachedFilter?.value;

      if (isMultiValueFilter(filter)) {
        return {
          ...filter,
          expanded,
          value: Array.isArray(cachedValue) ? cachedValue : [],
        };
      }

      return {
        ...filter,
        expanded,
        value: typeof cachedValue === "string" ? cachedValue : null,
      };
    });
  });

  useEffect(
    function updateFiltersOnSearchParamChange() {
      setFilters((prevFilters) => {
        const cachedFilters: UrlFilter[] = filterSearchParam ? JSON.parse(filterSearchParam) : [];
        const newFilters = prevFilters.map((prevFilter) => {
          const cachedFilter = cachedFilters.find(({ id }) => id === prevFilter.id);
          const cachedValue = cachedFilter?.value;

          if (isMultiValueFilter(prevFilter)) {
            return {
              ...prevFilter,
              value: Array.isArray(cachedValue) ? cachedValue : [],
            };
          }

          return {
            ...prevFilter,
            value: typeof cachedValue === "string" ? cachedValue : null,
          };
        });

        return newFilters;
      });
    },
    [filterSearchParam],
  );

  const saveFiltersInUrl = useCallback(
    (filters: FilterModel[]) => {
      setSearchParams((prev) => {
        prev.delete(FILTER_PARAM);

        const filtersWithValue = filters.filter((filter) => {
          const hasValue = isMultiValueFilter(filter) ? filter.value.length > 0 : filter.value !== null;
          return hasValue;
        });

        const urlFilters = filtersWithValue.map((filter) => {
          const { id, value } = filter;
          return { id, value };
        });

        if (urlFilters.length) {
          prev.append(FILTER_PARAM, JSON.stringify(urlFilters));
        }

        return prev;
      });
    },
    [setSearchParams],
  );

  const toggleFilter = useCallback((id: string, collapsed: boolean) => {
    setFilters((prevFilters) => {
      return prevFilters.map((filter) => {
        if (id === filter.id) {
          return { ...filter, expanded: !collapsed };
        }
        return filter;
      });
    });
  }, []);

  const applyChangesToFilter = (current: FilterModel[], changes: FilterChange[]): FilterModel[] => {
    // Build an id → value lookup once for O(1) access
    const lookup = new Map<string, FilterChange["value"]>();
    changes.forEach(({ id, value }) => lookup.set(id, value));

    return current.map((filter) => {
      if (!lookup.has(filter.id)) {
        return filter;
      }
      const value = lookup.get(filter.id);

      if (isMultiValueFilter(filter)) {
        return {
          ...filter,
          value: Array.isArray(value) ? value : [],
        };
      }

      return {
        ...filter,
        value: typeof value === "string" || value === null ? value : null,
      };
    });
  };

  const changeFilter = useCallback(
    (id: string, value: null | string | string[]) => {
      setFilters((prev) => {
        const next = applyChangesToFilter(prev, [{ id, value }]);
        // Persist new state to URL in the same tick
        saveFiltersInUrl(next);
        return next;
      });
    },
    [saveFiltersInUrl],
  );

  const changeFilters = useCallback(
    (changes: FilterChange[]) => {
      if (changes.length === 0) return;
      setFilters((prev) => {
        const next = applyChangesToFilter(prev, changes);
        saveFiltersInUrl(next);
        return next;
      });
    },
    [saveFiltersInUrl],
  );

  const removeFilterOption = useCallback(
    (filterId: string, optionId: string) => {
      setFilters((prev) => {
        const next = prev.map((filter) => {
          if (filter.id !== filterId) {
            return filter;
          }

          if (isMultiValueFilter(filter)) {
            return {
              ...filter,
              value: filter.value.filter((id) => id !== optionId),
            };
          }

          return {
            ...filter,
            value: null,
          };
        });

        saveFiltersInUrl(next);
        return next;
      });
    },
    [saveFiltersInUrl],
  );

  const selectedFilterOptions: SelectedFilterOption[] = useMemo(() => {
    return filters.flatMap((filter) => {
      return getSelectedValues(filter).map((selectedValue): SelectedFilterOption => {
        return {
          filterId: filter.id,
          filterName: filter.name,
          valueId: selectedValue.id,
          valueName: selectedValue.name,
        };
      });
    });
  }, [filters]);

  const serializedFilters: Array<Record<string, string | string[]>> = useMemo(() => {
    return filters.flatMap((filter) => {
      if (!filter.value || filter.value.length === 0) return [];
      return [
        {
          property: filter.id,
          type: filter.type,
          values: typeof filter.value === "string" ? [filter.value] : filter.value,
        },
      ];
    });
  }, [filters]);

  return useMemo(
    () => ({
      filters,
      changeFilter,
      changeFilters, // ← NEW batch method
      selectedFilterOptions,
      serializedFilters,
      removeFilterOption,
      toggleFilter,
    }),
    [filters, changeFilter, changeFilters, selectedFilterOptions, serializedFilters, removeFilterOption, toggleFilter],
  );
};
