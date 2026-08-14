import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isLocale,
  LANGUAGE_KEY,
  type Locale,
  readLocale,
  writeLocale,
} from "@/lib/i18n";

type LanguageProviderState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  setDefaultLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageProviderState | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    writeLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const setDefaultLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== LANGUAGE_KEY) {
        return;
      }
      setLocaleState(isLocale(event.newValue) ? event.newValue : "zh-CN");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = useMemo(
    () => ({ locale, setDefaultLocale, setLocale }),
    [locale, setDefaultLocale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
