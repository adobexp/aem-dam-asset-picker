import { useCallback, useEffect, useRef, useState } from "react";

interface SearchSuggestion {
  suggestion: string;
}

interface SearchSuggestionsResponse {
  suggestions?: SearchSuggestion[];
}

interface UseSearchSuggestionsReturn {
  suggestions: string[];
  error: string | null;
  selectedIndex: number;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  selectSuggestion: (suggestion: string) => void;
}

const MAX_SUGGESTIONS = 8;

export const useSearchSuggestions = (
  searchPhrase: string,
  onSelectSuggestion: (suggestion: string) => void,
  isOmniSearchEnable: boolean = false,
  tenantSearchPath: string = "/content/dam",
  debounceMs: number = 300,
): UseSearchSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSelectedSuggestion, setLastSelectedSuggestion] = useState<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      // Don't fetch if OmniSearch is disabled
      if (!isOmniSearchEnable) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (query === lastSelectedSuggestion) {
        return;
      }

      setError(null);

      try {
        const apiUrl = `/libs/granite/omnisearch?fulltext=${encodeURIComponent(
          query,
        )}&2_path=${encodeURIComponent(tenantSearchPath)}&mainasset=true&p.guessTotal=1000&location=asset`;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data: SearchSuggestionsResponse = await response.json();
        const suggestionsList = (data.suggestions || []).map((item) => item.suggestion).slice(0, MAX_SUGGESTIONS);

        setSuggestions(suggestionsList);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setSuggestions([]);
      } 
    },
    [tenantSearchPath, lastSelectedSuggestion, isOmniSearchEnable],
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set up debounced fetch if OmniSearch is enabled
    if (isOmniSearchEnable) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(searchPhrase);
      }, debounceMs);
    } else {
      // Clear suggestions if OmniSearch gets disabled
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchPhrase, fetchSuggestions, debounceMs, isOmniSearchEnable]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedIndex]);
          }
          break;

        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;

        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showSuggestions, suggestions, selectedIndex],
  );

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setLastSelectedSuggestion(suggestion);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onSelectSuggestion(suggestion);
    },
    [onSelectSuggestion],
  );

  useEffect(() => {
    if (searchPhrase !== lastSelectedSuggestion && lastSelectedSuggestion) {
      const timer = setTimeout(() => {
        setLastSelectedSuggestion("");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchPhrase, lastSelectedSuggestion]);

  return {
    suggestions,
    error,
    selectedIndex,
    showSuggestions,
    setShowSuggestions,
    handleKeyDown,
    selectSuggestion,
  };
};