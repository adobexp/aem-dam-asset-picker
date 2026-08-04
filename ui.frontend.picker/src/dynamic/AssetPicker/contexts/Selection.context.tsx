import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { AssetItem } from "../models/directoryStructure";
import { PickerAsset, PickerSelectionMode } from "../models/picker";
import { postCancel, postSelection } from "../utils/postMessageBridge";
import { toPickerAsset } from "../utils/toPickerAsset";

interface SelectionContextType {
  /** Full asset payloads keyed by path — required to build the OOTB postMessage body. */
  selectedAssets: Map<string, PickerAsset>;
  selectionCount: number;
  selectionMode: PickerSelectionMode;
  toggleAsset: (asset: AssetItem) => void;
  clearSelection: () => void;
  isSelected: (path: string) => boolean;
  confirmSelection: () => void;
  cancelSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

type SelectionProviderProps = {
  children: ReactNode;
  selectionMode?: PickerSelectionMode;
  targetOrigin?: string;
};

export const SelectionProvider: FC<SelectionProviderProps> = ({
  children,
  selectionMode = "multiple",
  targetOrigin = "*",
}) => {
  const [selectedAssets, setSelectedAssets] = useState<Map<string, PickerAsset>>(() => new Map());

  const toggleAsset = useCallback(
    (asset: AssetItem) => {
      if (!asset.data) {
        return;
      }

      const pickerAsset = toPickerAsset(asset.data);
      setSelectedAssets((prev) => {
        const next = selectionMode === "single" ? new Map<string, PickerAsset>() : new Map(prev);
        if (prev.has(pickerAsset.path) && selectionMode !== "single") {
          next.delete(pickerAsset.path);
        } else {
          next.set(pickerAsset.path, pickerAsset);
        }
        return next;
      });
    },
    [selectionMode],
  );

  const clearSelection = useCallback(() => {
    setSelectedAssets(new Map());
  }, []);

  const isSelected = useCallback((path: string) => selectedAssets.has(path), [selectedAssets]);

  const confirmSelection = useCallback(() => {
    if (selectedAssets.size === 0) {
      return;
    }
    postSelection(Array.from(selectedAssets.values()), targetOrigin);
  }, [selectedAssets, targetOrigin]);

  const cancelSelection = useCallback(() => {
    postCancel(targetOrigin);
  }, [targetOrigin]);

  const value = useMemo(
    () => ({
      selectedAssets,
      selectionCount: selectedAssets.size,
      selectionMode,
      toggleAsset,
      clearSelection,
      isSelected,
      confirmSelection,
      cancelSelection,
    }),
    [
      selectedAssets,
      selectionMode,
      toggleAsset,
      clearSelection,
      isSelected,
      confirmSelection,
      cancelSelection,
    ],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within SelectionProvider");
  }
  return context;
};
