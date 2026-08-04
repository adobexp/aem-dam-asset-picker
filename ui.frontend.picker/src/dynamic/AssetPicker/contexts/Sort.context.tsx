import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";

import { SortOrder, SortParam } from "../models/sort";

import { useConfiguration } from "./Configuration.context";

type Sort = {
  sortParams: SortParam[];
  sortId: string;
  sortOrder: SortOrder;
  handleSortChange: (id: string) => void;
  toggleSortOrderChange: () => void;
};

const SortContext = createContext<Sort>({
  sortParams: [],
  sortId: "",
  sortOrder: "asc",
  handleSortChange: () => undefined,
  toggleSortOrderChange: () => undefined,
});

export const SortProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { sort: sortParams = [] } = useConfiguration();
  const [sortId, setSortId] = useState(sortParams?.[0]?.id || "");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSortChange = useCallback((id: string) => {
    setSortId(id);
  }, []);

  const toggleSortOrderChange = useCallback(() => {
    setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
  }, []);

  const sort = useMemo(() => {
    return {
      sortParams,
      sortId,
      handleSortChange,
      sortOrder,
      toggleSortOrderChange,
    };
  }, [sortParams, sortId, sortOrder, toggleSortOrderChange, handleSortChange]);

  return <SortContext.Provider value={sort}>{children}</SortContext.Provider>;
};

export const useSort = () => {
  return useContext(SortContext);
};
