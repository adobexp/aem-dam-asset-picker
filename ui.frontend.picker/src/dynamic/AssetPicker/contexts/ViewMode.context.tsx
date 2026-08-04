import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from "react";

import { ViewMode, viewModes } from "../models/viewMode";

import { useConfiguration } from "./Configuration.context";

const ViewModeContext = createContext<{
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode) => void;
}>({
  viewMode: null,
  setViewMode: () => {},
});

const isValidViewMode = (mode: string | null): mode is ViewMode => {
  return viewModes.includes(mode as ViewMode);
};

export const ViewModeProvider: FC<PropsWithChildren<{ viewMode?: ViewMode }>> = ({ children }) => {
  const { viewMode: staticViewMode } = useConfiguration();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = sessionStorage.getItem("viewMode");
    if (isValidViewMode(savedViewMode)) {
      return savedViewMode;
    }

    if (staticViewMode) {
      return staticViewMode;
    }

    return "grid";
  });

  useEffect(() => {
    sessionStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  return <ViewModeContext.Provider value={{ viewMode, setViewMode }}>{children}</ViewModeContext.Provider>;
};

export const useViewMode = () => {
  return useContext(ViewModeContext);
};
