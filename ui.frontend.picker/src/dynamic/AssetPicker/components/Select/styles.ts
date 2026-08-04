// https://react-select.com/styles

import { StylesConfig } from "react-select";

export const styles: StylesConfig = {
  option: (styles, { isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      background: isDisabled
        ? undefined
        : isSelected
          ? "var(--select-background-selected)"
          : isFocused
            ? "var(--select-background-focused)"
            : undefined,
      color: isDisabled
        ? "var(--select-color-disabled)"
        : isSelected
          ? "var(--select-color-selected)"
          : "var(--select-color)",
      ":active": {
        ...styles[":active"],
        backgroundColor: isSelected ? "var(--select-background-selected-focused)" : "var(--select-background-selected)",
        color: "var(--select-color-selected)",
      },
    };
  },
};
