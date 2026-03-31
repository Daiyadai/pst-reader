"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, TranslationKey, t as translate } from "./i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => translate(key, "en"),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pst_lang") as Language | null;
    if (stored && ["en", "zh", "de"].includes(stored)) {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("pst_lang", newLang);
  };

  const tFunc = (key: TranslationKey) => translate(key, lang);

  // Avoid hydration mismatch: render with default "en" on server,
  // then switch after mount. Since layout is a server component wrapping
  // this client provider, we need to be careful.
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: "en", setLang, t: (key) => translate(key, "en") }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFunc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
