import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import type { Village } from '../data/types';

interface ArchiveExplorerModalProps {
  villages: Village[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVillage: (village: Village) => void;
}

const getVillageName = (village: Village) =>
  village.names?.en ?? village.name ?? '';

const getVillageSummary = (village: Village) =>
  village.narrative?.summary ?? village.story ?? village.overview ?? '';

const getVillageArabicName = (village: Village) =>
  village.names?.ar ?? village.name_arabic ?? '';

const buildSearchCorpus = (village: Village) =>
  [
    getVillageName(village),
    getVillageArabicName(village),
    village.district ?? '',
    getVillageSummary(village),
  ]
    .map((segment) => segment ?? '')
    .join(' ') 
    .toLowerCase();

const ArchiveExplorerModal: React.FC<ArchiveExplorerModalProps> = ({
  villages,
  isOpen,
  onClose,
  onSelectVillage,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const searchableVillages = useMemo(
    () =>
      villages.map((village) => ({
        village,
        name: getVillageName(village),
        arabicName: getVillageArabicName(village),
        district: village.district ?? '',
        summary: getVillageSummary(village),
        corpus: buildSearchCorpus(village),
      })),
    [villages]
  );

  const filteredVillages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return searchableVillages;
    }

    return searchableVillages.filter((entry) =>
      entry.corpus.includes(normalizedQuery)
    );
  }, [query, searchableVillages]);

  const handleSelect = (village: Village) => {
    onSelectVillage(village);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('archiveExplorer.title')}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="archive-search" className="block text-sm font-semibold uppercase tracking-widest text-text-tertiary">
            {t('archiveExplorer.searchLabel')}
          </label>
          <input
            id="archive-search"
            type="search"
            className="mt-2 w-full rounded-md border border-border bg-slate-950/60 px-4 py-2 text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/60"
            placeholder={t('archiveExplorer.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="mt-2 text-xs text-text-tertiary">
            {t('archiveExplorer.results', { count: filteredVillages.length })}
          </p>
        </div>

        {filteredVillages.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            {t('archiveExplorer.empty')}
          </p>
        ) : (
          <ul className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
            {filteredVillages.map(({ village, name, arabicName, district, summary }) => (
              <li key={`${village.id}-${name}`}>
                <button
                  type="button"
                  className="w-full text-left rounded-lg border border-border/50 bg-slate-950/60 px-4 py-3 transition-colors hover:border-accent/70 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  onClick={() => handleSelect(village)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold text-white">
                      {name || t('archiveExplorer.unknownVillage')}
                    </span>
                    {arabicName && (
                      <span className="text-sm text-text-tertiary">{arabicName}</span>
                    )}
                    <span className="text-xs uppercase tracking-widest text-text-tertiary">
                      {district}
                    </span>
                    {summary && (
                      <p className="text-sm text-text-secondary max-h-24 overflow-hidden">
                        {summary}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ArchiveExplorerModal;
