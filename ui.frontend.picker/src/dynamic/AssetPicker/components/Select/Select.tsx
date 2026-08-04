import { FC } from "react";
import ReactSelect, { GroupBase, StylesConfig } from "react-select";

import { FilterValue } from "../../models/filter";

import { styles } from "./styles";

type SelectProps = {
  value: string | null;
  values: FilterValue[];
  onChange: (value: string) => void;
};

export const Select: FC<SelectProps> = ({ value, values, onChange }) => {
  const options = values.map(({ id, name }) => {
    return { value: id, label: name };
  });

  const selectedOption = value === null ? null : options.find((option) => option.value === value);

  return (
    <ReactSelect
      value={selectedOption}
      options={options}
      onChange={(option) => {
        const id = option?.value;
        if (id) {
          onChange(id);
        }
      }}
      styles={
        styles as StylesConfig<
          { value: string; label: string } | undefined,
          false,
          GroupBase<{ value: string; label: string }>
        >
      }
    />
  );
};
