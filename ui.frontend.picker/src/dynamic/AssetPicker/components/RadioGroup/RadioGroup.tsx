import { FC } from "react";

import styles from "./RadioGroup.module.scss";

type RadioGroupProps = {
  id: string;
  value: null | string;
  values: Array<{ id: string; name: string }>;
  onChange: (value: null | string) => void;
};

export const RadioGroup: FC<RadioGroupProps> = ({ id, value, values, onChange }) => {
  const handleChange = (valueId: string) => {
    const nextValue = value === valueId ? null : valueId;
    onChange(nextValue);
  };

  return (
    <>
      {values.map(({ id: valueId, name }) => {
        return (
          <div key={valueId}>
            <label className={styles.field}>
              <div className={styles.input}>
                <input
                  name={id}
                  value={valueId}
                  type="radio"
                  checked={value === valueId}
                  onChange={() => handleChange(valueId)}
                />
              </div>
              <div className={styles.label}>{name}</div>
            </label>
          </div>
        );
      })}
    </>
  );
};
