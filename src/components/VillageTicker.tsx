import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Village } from '../data/types';

interface VillageTickerProps {
  villages: Village[];
}

const VillageTicker: React.FC<VillageTickerProps> = ({ villages }) => {
  const { t } = useTranslation(['common', 'app']);
  const [index, setIndex] = useState(0);
  const hasVillages = villages.length > 0;

  const message = useMemo(() => {
    if (!hasVillages) {
      return t('common:ticker.empty');
    }
    const village = villages[index];
    return t('common:ticker.remembering', { name: village.names.en });
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
      className="text-sm text-muted mt-2 min-h-[1.5rem] transition-opacity duration-500 ease-in-out flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{t('app:tickerLabel')}</span>
      <span aria-hidden="true" className="text-accent">•</span>
      <span>{message}</span>
    </p>
  );
};

export default VillageTicker;
