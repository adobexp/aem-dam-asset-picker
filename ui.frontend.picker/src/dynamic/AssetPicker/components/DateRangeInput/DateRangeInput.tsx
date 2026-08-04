import { ChangeEvent, FC, useMemo } from "react";

import { formatDateRange, parseDateRange } from "../../models/filter";

import styles from "./DateRangeInput.module.scss";

type DateRangeInputProps = {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

export const DateRangeInput: FC<DateRangeInputProps> = ({ id, value, onChange }) => {
  const { from, to } = useMemo(() => parseDateRange(value), [value]);

  const emit = (nextFrom: string, nextTo: string) => {
    onChange(formatDateRange(nextFrom, nextTo));
  };

  const handleFrom = (event: ChangeEvent<HTMLInputElement>) => {
    emit(event.target.value, to);
  };

  const handleTo = (event: ChangeEvent<HTMLInputElement>) => {
    emit(from, event.target.value);
  };

  return (
    <div className={styles.range} role="group" aria-labelledby={id}>
      <label className={styles.field}>
        <span className={styles.label}>From</span>
        <input
          className={styles.input}
          type="date"
          value={from}
          max={to || undefined}
          onChange={handleFrom}
          aria-label={`${id} from`}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>To</span>
        <input
          className={styles.input}
          type="date"
          value={to}
          min={from || undefined}
          onChange={handleTo}
          aria-label={`${id} to`}
        />
      </label>
    </div>
  );
};
