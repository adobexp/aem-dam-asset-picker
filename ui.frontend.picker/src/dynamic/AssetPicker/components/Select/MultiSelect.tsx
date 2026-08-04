import { FC } from "react";
import ReactSelect, { GroupBase, StylesConfig } from "react-select";

import { FilterValue } from "../../models/filter";

import { styles } from "./styles";

type MultiSelectProps = {
  value: string[];
  values: FilterValue[];
  onChange: (value: string[]) => void;
};

export const MultiSelect: FC<MultiSelectProps> = ({ value, values, onChange }) => {
  const options = values.map(({ id, name }) => {
    return { value: id, label: name };
  });

  const selectedOptions = value.map((valueId) => options.find((option) => valueId === option.value));

  return (
    <ReactSelect
      value={selectedOptions}
      options={options}
      isMulti={true}
      onChange={(options) => {
        const ids = options.map((option) => option?.value).filter((value): value is string => value !== undefined);
        onChange(ids);
      }}
      styles={
        styles as StylesConfig<
          { value: string; label: string } | undefined,
          true,
          GroupBase<{ value: string; label: string }>
        >
      }
    />
  );
};
