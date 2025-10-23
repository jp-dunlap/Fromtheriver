import React from 'react';

type VillageLinkProps = {
  name: string;
  onSelect: (name: string) => void;
};

export const VillageLink: React.FC<VillageLinkProps> = ({ name, onSelect }) => (
  <button
    type="button"
    className="village-link underline-offset-2"
    onClick={() => onSelect(name)}
  >
    {name}
  </button>
);
