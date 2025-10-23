import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Village } from '../data/types';

interface VillageTickerProps {
  villages: Village[];
}

const VillageTicker: React.FC<VillageTickerProps> = ({ villages }) => {
  const [index, setIndex] = useState(0);
  const hasVillages = villages.length > 0;
  const { t } = useTranslation();

  const message = useMemo(() => {
    if (!hasVillages) {
      return t('ticker.empty');
    }
    const village = villages[index];
    return `${t('ticker.prefix')} ${village.name}${t('ticker.suffix')}`;
  }, [hasVillages, villages, index, t]);

  useEffect(() => {
    if (!hasVillages) {
      return;
    }

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % villages.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [villages, hasVillages]);

  return (
    <p
      className="text-sm text-text-tertiary mt-2 min-h-[1.75rem] transition-opacity duration-500 ease-in-out flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/25 text-accent-strong"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M10 2.5a.75.75 0 01.684.462l1.387 3.26 3.51.27a.75.75 0 01.43 1.312l-2.68 2.382.796 3.446a.75.75 0 01-1.098.81L10 12.96l-3.029 1.482a.75.75 0 01-1.098-.81l.796-3.446-2.68-2.382a.75.75 0 01.43-1.312l3.51-.27 1.387-3.26A.75.75 0 0110 2.5z" />
        </svg>
      </span>
      <span>{message}</span>
    </p>
  );
};

export default VillageTicker;
