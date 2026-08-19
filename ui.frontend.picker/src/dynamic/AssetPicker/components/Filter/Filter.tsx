import { FC, useMemo } from "react";

import { useTranslation } from "../../contexts/I18n.context";
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
  /** Staged filter models so cascade options follow the unapplied parent value. */
  filters: FilterModel[];
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

export const Filter: FC<FilterProps> = ({ filter, filters, onChange, toggleFilter }) => {
  const { __ } = useTranslation();
  const { id, name, type, expanded, dependsOn, categoryValues } = filter;

  const handleFilterChange = (value: null | string | string[]): void => {
    onChange(value);
  };

  const cascadeValues = useMemo(() => {
    if (!dependsOn) return [];
    const parentFilter = filters.find((f: FilterModel) => f.id === dependsOn);
    if (!parentFilter || !("value" in parentFilter)) return [];

    const parentKeys = Array.isArray(parentFilter.value)
      ? parentFilter.value
      : parentFilter.value
        ? [parentFilter.value]
        : [];

    const seen = new Set<string>();
    const next: FilterValue[] = [];
    parentKeys.forEach((key) => {
      const group = categoryValues?.[key] || [];
      group.forEach((option) => {
        if (!option?.id || seen.has(option.id)) return;
        seen.add(option.id);
        next.push(option);
      });
    });
    return next;
  }, [dependsOn, filters, categoryValues]);

  const selectedCount = getSelectedCount(filter);
  const optionValues = dependsOn ? cascadeValues : "values" in filter ? filter.values : [];
  const searchable = filter.searchable !== false;
  const multiSelect = filter.multiSelect !== false;
  const waitingOnParent =
    Boolean(dependsOn) && optionValues.length === 0 && type !== "text" && type !== "daterange";

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
          {waitingOnParent && (
            <p className={styles.cascadeHint}>
              {__("directoryExplorer.selectParentFilter") || "Select a parent filter first"}
            </p>
          )}
          {type === "text" && (
            <TextInput
              id={id}
              value={filter.value}
              onChange={handleFilterChange}
              variant="pill"
              placeholder={filter.placeholder}
            />
          )}
          {!waitingOnParent && type === "checkbox" && (
            <CheckboxGroup
              id={id}
              values={optionValues}
              value={filter.value}
              onChange={handleFilterChange}
              searchable={searchable}
              multiSelect={multiSelect}
            />
          )}
          {!waitingOnParent && type === "radio" && (
            <RadioGroup id={id} values={optionValues} value={filter.value} onChange={handleFilterChange} />
          )}
          {!waitingOnParent && type === "select" && (
            <Select value={filter.value} onChange={handleFilterChange} values={optionValues} />
          )}
          {!waitingOnParent && type === "multiselect" && (
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
