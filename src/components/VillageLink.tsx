import React from 'react';
import { useTranslation } from 'react-i18next';

type VillageLinkProps = {
  name: string;
  onSelect: (name: string) => void;
};

export const VillageLink: React.FC<VillageLinkProps> = ({ name, onSelect }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="village-link underline-offset-2"
      onClick={() => onSelect(name)}
      aria-label={t('villages.open', { name })}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        <svg
          className="h-3 w-3 text-accent"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3.172 7.172a4 4 0 015.656-5.656l1 1a4 4 0 015.482 5.813l-6.364 6.364a4 4 0 11-5.657-5.657l2.121-2.121 1.414 1.414-2.121 2.121a2 2 0 102.828 2.828l6.364-6.364a2 2 0 10-2.828-2.828l-1-1a2 2 0 00-2.828 2.828l1.414 1.414-1.414 1.414-1.414-1.414z" />
        </svg>
        {name}
      </span>
    </button>
  );
};
