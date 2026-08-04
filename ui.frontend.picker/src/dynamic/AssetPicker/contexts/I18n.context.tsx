import { createContext, FC, PropsWithChildren, useCallback, useContext } from "react";

type I18n = {
  dictionary: Record<string, string> | null;
};

export const I18nContext = createContext<I18n>({
  dictionary: {},
});

export const I18nProvider: FC<PropsWithChildren<I18n>> = ({ dictionary, children }) => {
  // Picker ships without an authored dictionary on AEM; fall back to raw keys via useTranslation.
  return (
    <I18nContext.Provider value={{ dictionary: dictionary ?? {} }}>{children}</I18nContext.Provider>
  );
};

export const useI18n = () => {
  return useContext(I18nContext);
};

export const useTranslation = () => {
  const { dictionary } = useI18n();

  const __ = useCallback(
    (key: string) => dictionary?.[key] ?? key,
    [dictionary],
  );

  return { __ };
};
