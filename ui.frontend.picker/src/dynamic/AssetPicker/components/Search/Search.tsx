import { FC, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { FaSearch, FaSlidersH } from "react-icons/fa";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { useSearchOptions } from "../../contexts/searchOptionsContext";
import { useDefaultSearchScope } from "../../hooks/useDefaultSearchScope/useDefaultSearchScope";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { SearchParams, SearchScope } from "../../models/search";
import { Stats } from "../../models/stats";
import { Button } from "../Button";

import { SearchOptionsModal } from "./SearchOptionsModal";

import styles from "./Search.module.scss";

export type SearchProps = {
  phrase?: string;
  scope: SearchScope;
  tempSearchScope: SearchScope;
  onTempSearchScope: (scope: SearchScope) => void;
  onSearch: (params: SearchParams) => void;
  tempSearchPhrase: string;
  onTempSearch: (phrase: string) => void;
  setSearchStats: (searchStats: Stats | null) => void;
  semanticSearchEnabled: boolean;
  tempSemanticSearchEnabled: boolean;
  onSemanticSearchToggle: (value: boolean) => void;
  fuzzySearchEnabled: boolean;
  tempFuzzySearchEnabled: boolean;
  onFuzzySearchToggle: (value: boolean) => void;
};

export const Search: FC<SearchProps> = ({
  scope,
  tempSearchScope,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTempSearchScope,
  tempSearchPhrase = "",
  onSearch,
  onTempSearch,
  setSearchStats,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  semanticSearchEnabled,
  tempSemanticSearchEnabled,
  onSemanticSearchToggle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fuzzySearchEnabled,
  tempFuzzySearchEnabled,
  onFuzzySearchToggle,
}) => {
  const {
    showSemanticSearch,
    showFuzzySearch,
    defaultSemanticState,
    defaultFuzzyState,
    isOmniSearchEnable,
    tenantSearchPath,
  } = useConfiguration();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const defaultSearchScope = useDefaultSearchScope();
  const { __ } = useTranslation();

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [appliedSemantic, setAppliedSemantic] = useState<boolean>(tempSemanticSearchEnabled);
  const [appliedFuzzy, setAppliedFuzzy] = useState<boolean>(tempFuzzySearchEnabled);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const showSearchOptions = showSemanticSearch || showFuzzySearch;
  const { setSemanticSearchEnabled } = useSearchOptions();

  const handleSelectSuggestion = (suggestion: string) => {
    onTempSearch(suggestion);
    onSearch({
      phrase: suggestion,
      scope: tempSearchScope,
      semanticSearchEnabled: appliedSemantic,
      fuzzySearchEnabled: appliedFuzzy,
    });
  };

  const { suggestions, selectedIndex, showSuggestions, setShowSuggestions, handleKeyDown, selectSuggestion } =
    useSearchSuggestions(tempSearchPhrase, handleSelectSuggestion, isOmniSearchEnable, tenantSearchPath);

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setShowSuggestions(false);
    onSearch({
      phrase: tempSearchPhrase,
      scope: tempSearchScope,
      semanticSearchEnabled: appliedSemantic,
      fuzzySearchEnabled: appliedFuzzy,
    });
    if (tempSearchPhrase?.trim()) {
      setSemanticSearchEnabled(appliedSemantic);
    }
  };

  const handleSearchPhraseChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    onTempSearch(ev.target.value);
  };

  const handleClear = () => {
    onSearch({
      phrase: "",
      scope,
      semanticSearchEnabled: appliedSemantic,
      fuzzySearchEnabled: appliedFuzzy,
    });
    onTempSearch("");
    setSearchStats(null);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && tempSearchPhrase.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    selectSuggestion(suggestion);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowSuggestions]);

  useEffect(() => {
    setAppliedSemantic(!!defaultSemanticState);
    setAppliedFuzzy(!!defaultFuzzyState);

    onSemanticSearchToggle(!!defaultSemanticState);
    onFuzzySearchToggle(!!defaultFuzzyState);
  }, [defaultSemanticState, defaultFuzzyState, onSemanticSearchToggle, onFuzzySearchToggle]);

  const hasOptionsEnabled = appliedSemantic || appliedFuzzy;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.searchRow}>
        {/* ====== PILL SEARCH BAR ====== */}
        <div className={styles.searchBar}>
          {/* Magnifier icon (left) */}
          <FaSearch className={styles.searchIcon} aria-hidden="true" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={tempSearchPhrase}
            placeholder={__("directoryExplorer.searchPlaceholder") || "Search asset"}
            onChange={handleSearchPhraseChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            autoComplete="off"
            aria-label={__("directoryExplorer.searchPlaceholder") || "Search asset"}
          />

          {/* Clear (X) — appears only when there's a value */}
          {tempSearchPhrase.length > 0 && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label={__("directoryExplorer.clearSearch") || "Clear search"}
            >
              <AiOutlineClose />
            </button>
          )}

          {/* Filter / Search Options icon (right, INSIDE pill) */}
          {showSearchOptions && (
            <button
              type="button"
              className={styles.optionsIconBtn}
              onClick={() => setOptionsOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={optionsOpen}
              aria-label={__("directoryExplorer.searchOptions") || "Search options"}
              title={__("directoryExplorer.searchOptions") || "Search options"}
            >
              <FaSlidersH className={styles.optionsIcon} aria-hidden="true" />
              {hasOptionsEnabled && <span className={styles.enabledBadge} aria-hidden="true" />}
            </button>
          )}

          {/* Suggestions dropdown — anchored to the pill */}
          {isOmniSearchEnable && showSuggestions && (
            <div ref={suggestionsRef} className={styles.suggestionsDropdown}>
              {suggestions.length === 0 ? (
                <div className={styles.suggestionItem}>
                  <span>No results found</span>
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`${styles.suggestionItem} ${selectedIndex === index ? styles.selected : ""}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <FaSearch size={14} className={styles.suggestionIcon} />
                    <span className={styles.suggestionText}>{suggestion}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ====== SEARCH BUTTON (outside pill) ====== */}
        <Button type="submit" className={styles.searchBtn}>
          {__("directoryExplorer.search") || "Search"}
        </Button>
      </div>

      {/* Search options modal */}
      <SearchOptionsModal
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        showSemanticSearch={!!showSemanticSearch}
        showFuzzySearch={!!showFuzzySearch}
        appliedSemantic={appliedSemantic}
        appliedFuzzy={appliedFuzzy}
        onSemanticChange={(v) => {
          setAppliedSemantic(v);
          onSemanticSearchToggle(v);
        }}
        onFuzzyChange={(v) => {
          setAppliedFuzzy(v);
          // onFuzzyChange(v);
          onFuzzySearchToggle(v);
        }}
      />
    </form>
  );
};
