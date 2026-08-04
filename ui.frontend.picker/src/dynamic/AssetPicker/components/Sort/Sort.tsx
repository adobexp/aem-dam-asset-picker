import { FC, useEffect, useRef, useState } from "react";
import { MdOutlineArrowDropDown } from "react-icons/md";

import { useTranslation } from "../../contexts/I18n.context";
import { useSearchOptions } from "../../contexts/searchOptionsContext";
import { useSort } from "../../contexts/Sort.context";

import styles from "./Sort.module.scss";

const AscIcon: FC = () => {
  return (
    <svg
      className={styles.icon}
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 17H16M4 12H13M4 7H10M18 13V5M18 5L21 8M18 5L15 8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const DescIcon: FC = () => {
  return (
    <svg
      className={styles.icon}
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 17H10M4 12H13M18 11V19M18 19L21 16M18 19L15 16M4 7H16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Sort: FC = () => {
  const { __ } = useTranslation();
  const { sortParams, sortId, sortOrder, toggleSortOrderChange, handleSortChange } = useSort();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { semanticSearchEnabled } = useSearchOptions();
  console.log("Sort.tsx semanticSearchEnabled : " + semanticSearchEnabled);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = sortParams.find((param) => param.id === sortId);
  const displayText = selectedOption?.name ?? sortParams?.[0]?.name ?? __("directoryExplorer.sortBy");

  const handleOptionClick = (value: string) => {
    handleSortChange(value);
    setIsOpen(false);
  };
  return (
    <>
      {!semanticSearchEnabled && (
        <div className={styles.wrapper}>
          <div className={styles.customDropdown} ref={dropdownRef}>
            <div className={styles.dropdownTrigger} onClick={() => setIsOpen(!isOpen)}>
              <MdOutlineArrowDropDown size={20} />
              <span>{displayText}</span>
            </div>

            {isOpen && (
              <div className={styles.dropdownMenu}>
                {/* <div className={styles.dropdownOption} onClick={() => handleOptionClick("")}>
              {__("directoryExplorer.sortBy")}
            </div> */}
                {sortParams.map(({ id, name }) => (
                  <div
                    key={id}
                    className={`${styles.dropdownOption} ${sortId === id ? styles.selected : ""}`}
                    onClick={() => handleOptionClick(id)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className={styles.orderButton} onClick={() => toggleSortOrderChange()}>
            {sortOrder === "asc" ? <AscIcon /> : <DescIcon />}
          </button>
        </div>
      )}
    </>
  );
};
