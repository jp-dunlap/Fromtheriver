import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const RTL_LANGS = new Set(["ar"]);
const SUPPORTED_LANGS = new Set(["en", "es", "ar"]);
const STORAGE_KEY = "lang";

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation("common");
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const normalizedLanguage = activeLanguage.split("-")[0];
  const hasAppliedStoredLanguage = useRef(false);

  useEffect(() => {
    if (hasAppliedStoredLanguage.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    hasAppliedStoredLanguage.current = true;

    try {
      const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
      if (
        storedLanguage &&
        SUPPORTED_LANGS.has(storedLanguage) &&
        storedLanguage !== normalizedLanguage
      ) {
        void i18n.changeLanguage(storedLanguage);
      }
    } catch (error) {
      // Ignore storage access errors (e.g., Safari private mode)
    }
  }, [i18n, normalizedLanguage]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const language = normalizedLanguage;
    const html = document.documentElement;
    html.lang = language;
    html.dir = RTL_LANGS.has(language) ? "rtl" : "ltr";
  }, [normalizedLanguage]);

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <label
        htmlFor="language-select"
        className="font-medium text-text-secondary"
      >
        {t("language.label")}
      </label>
      <select
        id="language-select"
        className="bg-slate-900/70 border border-border/60 rounded-md px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        value={normalizedLanguage}
        onChange={(event) => {
          const nextLanguage = event.target.value;
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(STORAGE_KEY, nextLanguage);
            } catch (error) {
              // Ignore storage access errors
            }
          }
          void i18n.changeLanguage(nextLanguage);
        }}
      >
        <option value="en">{t("language.english")}</option>
        <option value="es">{t("language.spanish")}</option>
        <option value="ar">{t("language.arabic")}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
