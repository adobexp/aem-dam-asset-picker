import { useEffect, useState } from "react";

import { Filter } from "../../models/filter";
import { fetchJson, filtersUrl } from "../../utils/apiClient";

/**
 * Loads the sidebar filter definitions from the API.
 *
 * <p>When {@code authoredFilters} is already non-empty (embedded in {@code data-config}), the fetch
 * is skipped so the CA-config set always wins and a redundant request is avoided.
 *
 * <p>Returns `null` until they arrive, and stays `null` if the endpoint is unavailable, which lets
 * the caller fall back to whatever the AEM author put in `data-config` rather than show an empty
 * filter panel.
 */
export const useFilterDefinitions = (
  apiBase: string,
  root?: string,
  authoredFilters?: Filter[] | null,
): Filter[] | null => {
  const [filters, setFilters] = useState<Filter[] | null>(null);
  const hasAuthored = Array.isArray(authoredFilters) && authoredFilters.length > 0;

  useEffect(() => {
    if (hasAuthored) {
      setFilters(null);
      return;
    }

    let active = true;

    fetchJson<Filter[]>(filtersUrl(apiBase, root ?? ""))
      .then((definitions) => {
        if (active && Array.isArray(definitions) && definitions.length > 0) {
          setFilters(definitions);
        }
      })
      .catch((error) => {
        console.warn("Asset Picker filter definitions unavailable; using the authored set", error);
      });

    return () => {
      active = false;
    };
  }, [apiBase, root, hasAuthored]);

  return hasAuthored ? null : filters;
};
