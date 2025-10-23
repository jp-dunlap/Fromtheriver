import React from 'react';
import { useTranslation } from 'react-i18next';

const languageOrder: Array<{ code: string; key: string }> = [
  { code: 'en', key: 'app.language.names.en' },
  { code: 'es', key: 'app.language.names.es' },
  { code: 'ar', key: 'app.language.names.ar' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
      <label className="font-medium text-text-secondary" htmlFor="language-select">
        {t('app.language.label')}
      </label>
      <select
        id="language-select"
        className="bg-slate-900/70 border border-border/60 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent/70"
        value={currentLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        {languageOrder.map((language) => (
          <option key={language.code} value={language.code}>
            {t(language.key)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
