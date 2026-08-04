import { useConfiguration } from "../../contexts/Configuration.context";
import { SearchScope } from "../../models/search";

export const useDefaultSearchScope = (): SearchScope => {
  const { enableTypes } = useConfiguration();

  if (enableTypes) {
    return "filesAndFolders";
  }

  return "files";
};
