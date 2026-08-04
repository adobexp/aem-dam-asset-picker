import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Enable_FUZZY,
  Enable_SEMANTIC,
  isValidSearchScope,
  // SEARCH_MODE_PARAM,
  SEARCH_PARAM,
  SEARCH_SCOPE_PARAM,
  SearchParams,
  SearchScope,
} from "../../models/search";
import { useDefaultSearchScope } from "../useDefaultSearchScope/useDefaultSearchScope";

export const useSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultSearchScope = useDefaultSearchScope();

  const searchParam = searchParams.get(SEARCH_PARAM);
  const search = searchParam ?? "";
  const [tempSearch, setTempSearch] = useState<string>(search);

  const searchScopeParam = searchParams.get(SEARCH_SCOPE_PARAM);
  const searchScope = isValidSearchScope(searchScopeParam) ? searchScopeParam : defaultSearchScope;
  const [tempSearchScope, setTempSearchScope] = useState<SearchScope>(searchScope);

  const semanticSearchParam = searchParams.get(Enable_SEMANTIC);
  const semanticSearchEnabled = semanticSearchParam === "true";
  const [tempSemanticSearchEnabled, setTempSemanticSearchEnabled] = useState<boolean>(semanticSearchEnabled);

  const fuzzySearchParam = searchParams.get(Enable_FUZZY);
  const fuzzySearchEnabled = fuzzySearchParam === "true";
  const [tempFuzzySearchEnabled, setTempFuzzySearchEnabled] = useState<boolean>(fuzzySearchEnabled);

  useEffect(
    function resetTempSearchOnSearchChange() {
      setTempSearch(search);
    },
    [search],
  );

  useEffect(
    function resetTempSearchScopeOnSearchSopeChange() {
      setTempSearchScope(searchScope);
    },
    [searchScope],
  );

  useEffect(
    function resetTempSemanticSearchOnSemanticSearchChange() {
      // setTempSearchMode(searchMode);
      setTempSemanticSearchEnabled(semanticSearchEnabled);
      setTempFuzzySearchEnabled(fuzzySearchEnabled);
    },
    [semanticSearchEnabled, fuzzySearchEnabled],
  );

  const handleSearch = useCallback(
    ({ phrase, scope, semanticSearchEnabled, fuzzySearchEnabled }: SearchParams) => {
      setSearchParams((prev) => {
        prev.delete(SEARCH_PARAM);
        prev.delete(SEARCH_SCOPE_PARAM);
        prev.delete(Enable_SEMANTIC);
        prev.delete(Enable_FUZZY);
        if (phrase) {
          prev.set(SEARCH_PARAM, phrase);
        }
        if (scope) {
          prev.set(SEARCH_SCOPE_PARAM, scope);
        }
        // prev.set(SEARCH_MODE_PARAM, searchMode);
        prev.set(Enable_SEMANTIC, semanticSearchEnabled === true ? "true" : "false");
        prev.set(Enable_FUZZY, fuzzySearchEnabled === true ? "true" : "false");
        return prev;
      });
    },
    [setSearchParams],
  );

  return useMemo(
    () => ({
      search,
      tempSearch,
      setTempSearch,
      searchScope,
      tempSearchScope,
      setTempSearchScope,
      semanticSearchEnabled,
      tempSemanticSearchEnabled,
      setTempSemanticSearchEnabled,
      fuzzySearchEnabled,
      tempFuzzySearchEnabled,
      setTempFuzzySearchEnabled,
      handleSearch,
    }),
    [
      search,
      tempSearch,
      searchScope,
      tempSearchScope,
      semanticSearchEnabled,
      tempSemanticSearchEnabled,
      fuzzySearchEnabled,
      tempFuzzySearchEnabled,
      handleSearch,
    ],
  );
};
