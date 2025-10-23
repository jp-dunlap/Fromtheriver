import React from 'react';
import type { Village } from '../data/types';

type VillageLinkProps = {
  village: Village;
  onSelect: (village: Village) => void;
};

export const VillageLink: React.FC<VillageLinkProps> = ({ village, onSelect }) => (
  <button
    type="button"
    className="village-link underline-offset-2"
    onClick={() => onSelect(village)}
  >
    {village.names.en}
  </button>
);
