import { FC, useEffect, useMemo, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { CardViewProvider } from "../../contexts/CardView.context";
import { Configuration, ConfigurationProvider } from "../../contexts/Configuration.context";
import { I18nProvider } from "../../contexts/I18n.context";
import { SearchOptionsProvider } from "../../contexts/searchOptionsContext";
import { SelectionProvider } from "../../contexts/Selection.context";
import { SortProvider } from "../../contexts/Sort.context";
import { ThemeProvider } from "../../contexts/Theme.context";
import { ViewModeProvider } from "../../contexts/ViewMode.context";
import { useFilterDefinitions } from "../../hooks/useFilterDefinitions";
import { parsePickerParams } from "../../utils/parsePickerParams";
import { AssetPickerView } from "../AssetPickerView";

import "../../styles/index.scss";

type AppProps = {
  /** JSON emitted by the Sling model on the selector component. */
  config: string;
  translations?: string;
};

/**
 * Merges the query parameters the host page passed on the picker URL over the defaults
 * the author configured in AEM. The URL always wins, since it expresses what this
 * particular launch asked for, but it can only narrow within the configured roots:
 * `resolveRoot` refuses a `root` that sits outside them.
 */
const buildConfiguration = (raw: string): Configuration => {
  const { rootDirectory, rootDirectories: configuredRoots, ...rest } = JSON.parse(raw);
  const params = parsePickerParams();

  const roots: string[] = Array.isArray(configuredRoots)
    ? configuredRoots
    : Array.isArray(rootDirectory)
      ? rootDirectory
      : rootDirectory
        ? [rootDirectory]
        : [];

  const requestedRoot = params.rootDirectory;
  const isWithinConfiguredRoots =
    !!requestedRoot && (roots.length === 0 || roots.some((root) => requestedRoot.startsWith(root)));

  if (requestedRoot && !isWithinConfiguredRoots) {
    console.warn(`Ignoring root "${requestedRoot}": it is outside the configured picker roots`);
  }

  return {
    ...rest,
    rootDirectories: isWithinConfiguredRoots ? [requestedRoot] : roots,
    // Host `?theme=` wins over the authored / CA default for this launch.
    theme: params.theme ?? rest.theme ?? "light",
    selectionMode: params.selectionMode ?? rest.selectionMode ?? "multiple",
    pickerViewMode: params.pickerViewMode ?? rest.pickerViewMode ?? "browse",
    targetOrigin: params.targetOrigin ?? rest.targetOrigin ?? "*",
    pickerParams: params,
  };
};

export const App: FC<AppProps> = ({ config, translations }) => {
  const authored = useMemo(() => buildConfiguration(config), [config]);
  const filters = useFilterDefinitions(authored.apiBase, authored.rootDirectories[0], authored.filters);
  const configuration = useMemo<Configuration>(
    () => (filters ? { ...authored, filters } : authored),
    [authored, filters],
  );

  const [dictionary, setDictionary] = useState<Record<string, string> | null>(() =>
    translations ? JSON.parse(translations) : null,
  );

  useEffect(() => {
    async function fetchMockDictionary() {
      const response = await fetch("/mocks/__dictionary__.json");
      setDictionary(await response.json());
    }

    // Local mock harness only — production AEM uses key fallbacks when no dictionary is authored.
    if (process.env.API === "mock" && !dictionary) {
      fetchMockDictionary();
    }
  }, [dictionary]);

  return (
    <ConfigurationProvider configuration={configuration}>
      <I18nProvider dictionary={dictionary}>
        <SelectionProvider selectionMode={configuration.selectionMode} targetOrigin={configuration.targetOrigin}>
          <ThemeProvider>
            <ViewModeProvider>
              <CardViewProvider>
                <SortProvider>
                  <SearchOptionsProvider>
                    <HashRouter>
                      <Routes>
                        <Route index element={<AssetPickerView />} />
                        <Route path="*" element={<AssetPickerView />} />
                      </Routes>
                    </HashRouter>
                  </SearchOptionsProvider>
                </SortProvider>
              </CardViewProvider>
            </ViewModeProvider>
          </ThemeProvider>
        </SelectionProvider>
      </I18nProvider>
    </ConfigurationProvider>
  );
};
