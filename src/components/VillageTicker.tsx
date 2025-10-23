import React, { useEffect, useMemo, useState } from 'react';
import { Village } from '../data/types';

interface VillageTickerProps {
  villages: Village[];
}

const VillageTicker: React.FC<VillageTickerProps> = ({ villages }) => {
  const [index, setIndex] = useState(0);
  const hasVillages = villages.length > 0;

  const message = useMemo(() => {
    if (!hasVillages) {
      return 'Historical record is empty.';
    }
    const village = villages[index];
    return `Remembering ${village.name}...`;
  }, [hasVillages, villages, index]);

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
    <p className="text-sm text-muted mt-2 min-h-[1.5rem] transition-opacity duration-500 ease-in-out">
      {message}
    </p>
  );
};

export default VillageTicker;
