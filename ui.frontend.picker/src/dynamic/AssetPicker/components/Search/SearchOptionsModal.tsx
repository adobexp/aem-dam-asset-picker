import React, { useEffect, useRef, useState } from "react";

import { useTranslation } from "../../contexts/I18n.context";

import styles from "./Search.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
  // tempSearchMode: string;
  // onSearchMode: (value: string) => void;
  showSemanticSearch: boolean;
  showFuzzySearch: boolean;
  appliedSemantic: boolean;
  appliedFuzzy: boolean;
  onSemanticChange: (v: boolean) => void;
  onFuzzyChange: (v: boolean) => void;
};

export const SearchOptionsModal: React.FC<Props> = ({
  open,
  onClose,
  showSemanticSearch,
  showFuzzySearch,
  appliedSemantic,
  appliedFuzzy,
  onSemanticChange,
  onFuzzyChange,
}) => {
  const { __ } = useTranslation();
  const [localSemantic, setLocalSemantic] = useState<boolean>(false);
  const [localFuzzy, setLocalFuzzy] = useState<boolean>(false);
  const firstToggleRef = useRef<HTMLInputElement | null>(null);

  // initialize local toggles when modal opens
  useEffect(() => {
    if (open) {
      setLocalSemantic(appliedSemantic);
      setLocalFuzzy(appliedFuzzy);
    }
  }, [open, appliedSemantic, appliedFuzzy]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // focus first toggle when opened
  useEffect(() => {
    if (open) setTimeout(() => firstToggleRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  // ensure XOR behaviour
  const handleSemanticChange = (checked: boolean) => {
    setLocalSemantic(checked);
  };

  const handleFuzzyChange = (checked: boolean) => {
    setLocalFuzzy(checked);
  };

  const handleApply = () => {
    onSemanticChange(localSemantic);
    onFuzzyChange(localFuzzy);
    onClose();
  };

  // modal UI
  return (
    <div
      className={styles.searchOptionsModalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.searchOptionsModal}
        role="dialog"
        aria-modal="true"
        aria-label={__("directoryExplorer.searchOptions") || "Search Options"}
      >
        {/* header */}
        <div className={styles.searchOptionsHeader}>
          <h2 className={styles.searchOptionsTitle}>{__("directoryExplorer.searchOptions") || "Search Options"}</h2>
          <button
            className={styles.searchOptionsClose}
            onClick={onClose}
            aria-label={__("directoryExplorer.close") || "Close"}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className={styles.searchOptionsBody}>
          {showSemanticSearch && (
            <div className={styles.searchOptionRow}>
              <div className={styles.searchOptionText}>
                <div className={styles.searchOptionTitle}>
                  {__("directoryExplorer.semanticSearch") || "Semantic Search"}
                </div>
                <div className={styles.searchOptionSubtitle}>
                  {__("directoryExplorer.semanticSearchDesc") || "Find results by meaning and context"}
                </div>
              </div>

              <label className={styles.toggleLabel}>
                <input
                  ref={firstToggleRef}
                  className={styles.toggleInput}
                  type="checkbox"
                  checked={localSemantic}
                  onChange={(e) => handleSemanticChange(e.target.checked)}
                  aria-checked={localSemantic}
                  aria-label={__("directoryExplorer.semanticSearch") || "Semantic Search"}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          )}
          {showSemanticSearch && showFuzzySearch && <div className={styles.searchOptionDivider} />}

          {showFuzzySearch && (
            <>
              <div className={styles.searchOptionRow}>
                <div className={styles.searchOptionText}>
                  <div className={styles.searchOptionTitle}>
                    {__("directoryExplorer.fuzzySearch") || "Fuzzy Search"}
                  </div>
                  <div className={styles.searchOptionSubtitle}>
                    {__("directoryExplorer.fuzzySearchDesc") || "Match similar or misspelled terms"}
                  </div>
                </div>

                <label className={styles.toggleLabel}>
                  <input
                    className={styles.toggleInput}
                    type="checkbox"
                    checked={localFuzzy}
                    onChange={(e) => handleFuzzyChange(e.target.checked)}
                    aria-checked={localFuzzy}
                    aria-label={__("directoryExplorer.fuzzySearch") || "Fuzzy Search"}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <div className={styles.searchOptionsFooter}>
          <div className={styles.footerSpacer} />
          <div className={styles.footerButtons}>
            <button className={styles.modalButton} onClick={onClose}>
              {__("directoryExplorer.cancel") || "Cancel"}
            </button>
            <button className={styles.modalPrimary} onClick={handleApply}>
              {__("directoryExplorer.apply") || "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
