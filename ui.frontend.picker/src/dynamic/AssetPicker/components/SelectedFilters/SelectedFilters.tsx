import { FC } from "react";
import { IoClose } from "react-icons/io5";

import { useTranslation } from "../../contexts/I18n.context";
import { SelectedFilterOption } from "../../models/filter";
import { Button } from "../Button";

import styles from "./SelectedFilters.module.scss";

type SelectedFiltersProps = {
  search: string;
  selectedFilterOptions: SelectedFilterOption[];
  removeFilterOption: (filterId: string, optionId: string) => void;
};

export const SelectedFilters: FC<SelectedFiltersProps> = ({ search, selectedFilterOptions, removeFilterOption }) => {
  const { __ } = useTranslation();
  const handleFilterOptionClick = (filterId: string, optionId: string) => {
    removeFilterOption(filterId, optionId);
  };

  return (
    <div>
      {/* {search && (
        <p className={styles.search}>
          {__("directoryExplorer.searchingFor")}: <span className={styles.searchPhrase}>{search}</span>
        </p>
      )} */}

      {selectedFilterOptions.length > 0 && (
        <div className={styles.options}>
          {selectedFilterOptions.map(({ filterId, filterName, valueId, valueName }) => (
            <Button
              key={`${filterId}-${valueId}`}
              size="small"
              type="button"
              className={styles.option}
              onClick={() => handleFilterOptionClick(filterId, valueId)}
              title={`${filterName}: ${valueName}`}
            >
              <span className={styles.closeIcon}>
                <IoClose />
              </span>
              <span className={styles.filterName}>{filterName}</span>:
              <span className={styles.filterValue}>{valueName}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
