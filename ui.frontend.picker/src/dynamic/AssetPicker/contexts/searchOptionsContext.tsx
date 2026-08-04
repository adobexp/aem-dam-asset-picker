import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface SearchOptionsContextType {
  semanticSearchEnabled: boolean;
  setSemanticSearchEnabled: (value: boolean) => void;
}

const SearchOptionsContext = createContext<SearchOptionsContextType | undefined>(undefined);

export const SearchOptionsProvider = ({ children }: { children: ReactNode }) => {
  const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(false);

  const value = useMemo(
    () => ({
      semanticSearchEnabled,
      setSemanticSearchEnabled,
    }),
    [semanticSearchEnabled],
  );

  return <SearchOptionsContext.Provider value={value}>{children}</SearchOptionsContext.Provider>;
};

export const useSearchOptions = () => {
  const context = useContext(SearchOptionsContext);

  if (!context) {
    throw new Error("useSearchOptions must be used within SearchOptionsProvider");
  }

  return context;
};
