import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LANGS = new Set(['ar']);

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const normalizedLanguage = activeLanguage.split('-')[0];

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const language = activeLanguage;
    const html = document.documentElement;
    html.lang = language;
    html.dir = RTL_LANGS.has(language) ? 'rtl' : 'ltr';
  }, [activeLanguage]);

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <label htmlFor="language-select" className="font-medium text-text-secondary">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        className="bg-slate-900/70 border border-border/60 rounded-md px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        value={normalizedLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        <option value="en">{t('language.english')}</option>
        <option value="es">{t('language.spanish')}</option>
        <option value="ar">{t('language.arabic')}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
