import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

type CardViewMode = "classic" | "new";

type CardViewContextValue = {
  cardView: CardViewMode;
  toggleCardView: () => void;
  isNewCard: boolean;
};

const STORAGE_KEY = "assetBrowser.cardView";

const CardViewContext = createContext<CardViewContextValue | undefined>(undefined);

export const CardViewProvider: FC<PropsWithChildren> = ({ children }) => {
  const [cardView, setCardView] = useState<CardViewMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "new" ? "new" : "classic";
    } catch {
      return "classic";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, cardView);
    } catch {
      /* ignore */
    }
  }, [cardView]);

  const toggleCardView = useCallback(() => {
    setCardView((prev) => (prev === "classic" ? "new" : "classic"));
  }, []);

  return (
    <CardViewContext.Provider value={{ cardView, toggleCardView, isNewCard: cardView === "new" }}>
      {children}
    </CardViewContext.Provider>
  );
};

export const useCardView = (): CardViewContextValue => {
  const ctx = useContext(CardViewContext);
  if (!ctx) {
    throw new Error("useCardView must be used within a CardViewProvider");
  }
  return ctx;
};
