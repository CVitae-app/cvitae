import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation as useI18nextTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translations from "../utils/translations";

const LanguageContext = createContext();

// Init i18n only once
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: translations,
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(i18n.language);

  const switchLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem("language", lng);
  }, []);

  useEffect(() => {
    const currentLng = i18n.language;
    if (currentLng !== language) setLanguage(currentLng);
    document.documentElement.lang = currentLng; // ✅ Sync <html lang="">
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { t, i18n } = useI18nextTranslation();
  const { language, switchLanguage } = useLanguage();

  const ready = i18n.isInitialized && i18n.language === language;

  return { t, language, setLanguage: switchLanguage, ready };
}
