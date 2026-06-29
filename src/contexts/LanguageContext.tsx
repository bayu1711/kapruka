import React, { createContext, useContext, useState, useEffect } from 'react';
import { dict, Locale } from '../i18n/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'kapruka_magic_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en-US');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
      if (saved && dict[saved]) {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, loc);
    }
  };

  const t = (key: string) => {
    return dict[locale][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
