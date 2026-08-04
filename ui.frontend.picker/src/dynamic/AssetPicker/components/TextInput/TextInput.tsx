import { ChangeEvent, FC, KeyboardEvent, useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";

import classNames from "classnames";

import { useTranslation } from "../../contexts/I18n.context";

import styles from "./TextInput.module.scss";

type TextInputVariant = "default" | "pill";

type TextInputProps = {
  id: string;
  value: string | null;
  onChange: (value: string) => void;
  /**
   * Visual variant:
   *  - "default": original border + side submit button (back-compat)
   *  - "pill":    rounded pill with magnifier (idle) / X (when has value)
   */
  variant?: TextInputVariant;
  placeholder?: string;
};

export const TextInput: FC<TextInputProps> = ({ value, onChange, variant = "default", placeholder }) => {
  const [tempValue, setTempValue] = useState<string>(value ?? "");
  const { __ } = useTranslation();

  useEffect(() => {
    setTempValue(value ?? "");
  }, [value]);

  const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      onChange(tempValue);
    }
  };

  const handleSubmit = () => {
    onChange(tempValue);
  };

  const handleClear = () => {
    setTempValue("");
    onChange("");
  };

  const placeholderText = placeholder ?? __("directoryExplorer.searchPlaceholder");

  if (variant === "pill") {
    const hasValue = tempValue.trim() !== "";
    return (
      <div className={classNames(styles.wrapper, styles.pill)}>
        <input
          className={classNames(styles.input, styles.pillInput)}
          type="text"
          placeholder={placeholderText}
          value={tempValue}
          onKeyDown={handleKeyDown}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => setTempValue(ev.target.value)}
        />
        <button
          type="button"
          className={styles.pillAction}
          onClick={hasValue ? handleClear : handleSubmit}
          aria-label={hasValue ? "Clear" : "Search"}
        >
          {hasValue ? (
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Default variant — original layout preserved for back-compat
  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholderText}
        value={tempValue}
        onKeyDown={handleKeyDown}
        onChange={(ev: ChangeEvent<HTMLInputElement>) => setTempValue(ev.target.value)}
      />
      <button className={styles.button} type="button" onClick={handleSubmit}>
        <AiOutlineSearch />
      </button>
    </div>
  );
};
