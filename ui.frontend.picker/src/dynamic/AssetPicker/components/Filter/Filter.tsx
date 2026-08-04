import { FC, useMemo } from "react";

import { useFilters } from "../../hooks/useFilters";
import { Filter as FilterModel, FilterValue } from "../../models/filter";
import { CheckboxGroup } from "../CheckboxGroup";
import { Collapsible } from "../Collapsible";
import { DateRangeInput } from "../DateRangeInput";
import { RadioGroup } from "../RadioGroup";
import { MultiSelect, Select } from "../Select";
import { TextInput } from "../TextInput";

import styles from "./Filter.module.scss";

type FilterProps = {
  filter: FilterModel;
  toggleFilter: (id: string, collapsed: boolean) => void;
  onChange: (value: null | string | string[]) => void;
};

const getSelectedCount = (filter: FilterModel): number => {
  if (!("value" in filter)) return 0;
  const value = filter.value;
  if (Array.isArray(value)) return value.length;
  if (value === null || value === undefined || value === "") return 0;
  return 1;
};

export const Filter: FC<FilterProps> = ({ filter, onChange, toggleFilter }) => {
  const { filters } = useFilters();
  const { id, name, type, expanded, dependsOn, categoryValues } = filter;

  const handleFilterChange = (value: null | string | string[]): void => {
    onChange(value);
  };

  const cascadeValues = useMemo(() => {
    if (!dependsOn) return [];
    const dependentFilter = filters.find((f: FilterModel) => f.id === dependsOn);
    if (!dependentFilter || !("value" in dependentFilter)) return [];

    const filterValues = Array.isArray(dependentFilter.value)
      ? dependentFilter.value
      : dependentFilter.value
        ? [dependentFilter.value]
        : [];

    return filterValues.flatMap((key) => {
      return (categoryValues as Record<string, FilterValue[]>)[key] || [];
    });
  }, [dependsOn, filters, categoryValues]);

  const selectedCount = getSelectedCount(filter);
  const optionValues = dependsOn ? cascadeValues : "values" in filter ? filter.values : [];
  const searchable = filter.searchable !== false;
  const multiSelect = filter.multiSelect !== false;

  return (
    <div className={styles.filter}>
      <Collapsible
        id={id}
        title={name}
        collapsed={!expanded}
        onSetCollapsed={(collapsed) => toggleFilter(filter.id, collapsed)}
        badge={selectedCount > 0 ? `(${selectedCount} selected)` : undefined}
      >
        <div className={styles.content}>
          {type === "text" && (
            <TextInput
              id={id}
              value={filter.value}
              onChange={handleFilterChange}
              variant="pill"
              placeholder={filter.placeholder}
            />
          )}
          {type === "checkbox" && (
            <CheckboxGroup
              id={id}
              values={optionValues}
              value={filter.value}
              onChange={handleFilterChange}
              searchable={searchable}
              multiSelect={multiSelect}
            />
          )}
          {type === "radio" && (
            <RadioGroup id={id} values={optionValues} value={filter.value} onChange={handleFilterChange} />
          )}
          {type === "select" && (
            <Select value={filter.value} onChange={handleFilterChange} values={optionValues} />
          )}
          {type === "multiselect" && (
            <MultiSelect value={filter.value} onChange={handleFilterChange} values={optionValues} />
          )}
          {type === "daterange" && (
            <DateRangeInput id={id} value={filter.value} onChange={handleFilterChange} />
          )}
        </div>
      </Collapsible>
    </div>
  );
};
