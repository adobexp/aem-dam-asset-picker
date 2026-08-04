export const SEARCH_PARAM = "search";
export const SEARCH_SCOPE_PARAM = "search-scope";
// export const SEARCH_MODE_PARAM = "searchModeType";
export const Enable_SEMANTIC = "semanticSearchEnabled";
export const Enable_FUZZY = "fuzzySearchEnabled";

export const searchScopes = ["files", "folders", "filesAndFolders"] as const;
export type SearchScope = (typeof searchScopes)[number];

export type SearchParams = {
  phrase: string;
  scope: SearchScope;
  semanticSearchEnabled: boolean;
  fuzzySearchEnabled: boolean;
};

export const isValidSearchScope = (value: unknown): value is SearchScope => {
  return searchScopes.includes(value as SearchScope);
};

export type SearchBoxAlignment = "left" | "center" | "right";
