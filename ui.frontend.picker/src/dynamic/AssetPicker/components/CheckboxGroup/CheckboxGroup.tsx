import { ChangeEvent, FC, useMemo, useState } from "react";

import classNames from "classnames";

import styles from "./CheckboxGroup.module.scss";

type CheckboxValue = { id: string; name: string };

type CheckboxGroupProps = {
  id: string;
  value: Array<string>;
  values: Array<CheckboxValue>;
  onChange: (value: string[]) => void;
  /** When true, shows an internal search input above the list */
  searchable?: boolean;
  /** Optional placeholder for the search input */
  searchPlaceholder?: string;
  /** When false, selecting an option replaces the previous selection (single-select). Defaults to true. */
  multiSelect?: boolean;
};

export const CheckboxGroup: FC<CheckboxGroupProps> = ({
  id,
  value,
  values,
  onChange,
  searchable = false,
  searchPlaceholder = "Search",
  multiSelect = true,
}) => {
  const [query, setQuery] = useState<string>("");

  const handleChange = (valueId: string) => {
    if (!multiSelect) {
      onChange(value.includes(valueId) ? [] : [valueId]);
      return;
    }
    const nextValue = value.includes(valueId) ? value.filter((v) => v !== valueId) : [...value, valueId];
    onChange(nextValue);
  };

  const filteredValues = useMemo(() => {
    if (!searchable || query.trim() === "") return values ?? [];
    const q = query.trim().toLowerCase();
    return (values ?? []).filter(({ name }) => name.toLowerCase().includes(q));
  }, [searchable, query, values]);

  const handleQueryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setQuery(ev.target.value);
  };

  const handleClearQuery = () => setQuery("");

  if (!values || values.length === 0) {
    return <div className={styles.noFilter}>No filters available</div>;
  }

  const hasQuery = query.trim() !== "";
  const showNoResults = searchable && hasQuery && filteredValues.length === 0;

  return (
    <div className={styles.group}>
      {searchable && (
        <div className={styles.searchPill}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={handleQueryChange}
            aria-label={`Search ${id}`}
          />
          <button
            type="button"
            className={styles.searchAction}
            onClick={hasQuery ? handleClearQuery : undefined}
            aria-label={hasQuery ? "Clear search" : "Search"}
            tabIndex={hasQuery ? 0 : -1}
          >
            {hasQuery ? (
              // X icon
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              // Magnifier icon
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
                <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      )}

      {showNoResults ? (
        <div className={styles.noResults}>No results found. Try a different search.</div>
      ) : (
        <ul className={styles.list} role="group" aria-labelledby={id}>
          {filteredValues.map(({ id: valueId, name }) => {
            const checked = value.includes(valueId);
            return (
              <li key={valueId} className={styles.item}>
                <label className={styles.field}>
                  <span className={styles.inputWrap}>
                    <input
                      name={id}
                      value={valueId}
                      type="checkbox"
                      className={styles.nativeInput}
                      checked={checked}
                      onChange={() => handleChange(valueId)}
                    />
                    <span
                      className={classNames(styles.box, {
                        [styles.boxChecked]: checked,
                      })}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg width="12" height="12" viewBox="0 0 12 12" className={styles.tick}>
                          <path
                            d="M2.5 6.5L4.8 8.8L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className={styles.label}>{name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
