import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import type { Village } from '../data/types';

interface ArchiveExplorerModalProps {
  villages: Village[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVillage: (village: Village) => void;
}

interface SearchIndexEntry {
  village: Village;
  tokens: Set<string>;
  weightedTokens: Map<string, number>;
}

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const buildIndex = (villages: Village[]): SearchIndexEntry[] =>
  villages.map((village) => {
    const weightedTokens = new Map<string, number>();
    const pushTokens = (tokens: string[], weight: number) => {
      tokens.forEach((token) => {
        weightedTokens.set(token, (weightedTokens.get(token) ?? 0) + weight);
      });
    };

    pushTokens(tokenize(village.names.en), 3);
    pushTokens(tokenize(village.names.ar), 2);
    pushTokens(tokenize(village.district), 1.5);
    pushTokens(tokenize(village.narrative.summary), 1);
    village.narrative.key_events.forEach((event) => {
      pushTokens(tokenize(event.value), 1);
    });

    const tokenSet = new Set(weightedTokens.keys());

    return {
      village,
      tokens: tokenSet,
      weightedTokens,
    };
  });

const ArchiveExplorerModal: React.FC<ArchiveExplorerModalProps> = ({
  villages,
  isOpen,
  onClose,
  onSelectVillage,
}) => {
  const [query, setQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [hasTestimonyOnly, setHasTestimonyOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    } else {
      setQuery('');
      setDistrictFilter('all');
      setHasTestimonyOnly(false);
    }
  }, [isOpen]);

  const index = useMemo(() => buildIndex(villages), [villages]);

  const districts = useMemo(() => {
    const unique = Array.from(new Set(villages.map((village) => village.district))).sort();
    return unique;
  }, [villages]);

  const results = useMemo(() => {
    const tokens = tokenize(query);
    const hasTokens = tokens.length > 0;

    const filtered = index
      .map((entry) => {
        const matchesTokens = tokens.reduce((score, token) => {
          if (!entry.tokens.has(token)) {
            return score;
          }
          return score + (entry.weightedTokens.get(token) ?? 0);
        }, 0);

        const passesQuery = hasTokens ? matchesTokens > 0 : true;
        const passesDistrict =
          districtFilter === 'all' || entry.village.district === districtFilter;
        const passesTestimony = hasTestimonyOnly
          ? entry.village.testimonies.length > 0
          : true;

        return {
          entry,
          matchesTokens,
          passesQuery,
          passesDistrict,
          passesTestimony,
        };
      })
      .filter((candidate) => candidate.passesQuery && candidate.passesDistrict && candidate.passesTestimony)
      .sort((a, b) => {
        if (b.matchesTokens === a.matchesTokens) {
          return a.entry.village.names.en.localeCompare(b.entry.village.names.en);
        }
        return b.matchesTokens - a.matchesTokens;
      })
      .map((candidate) => candidate.entry.village);

    if (!hasTokens) {
      return filtered.slice(0, 25);
    }
    return filtered;
  }, [index, query, districtFilter, hasTestimonyOnly]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archive Explorer">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <label className="flex-1">
            <span className="text-xs uppercase tracking-wider text-muted block mb-1">Search the archive</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a village, district, or historical keyword…"
              className="w-full rounded-md bg-slate-900/80 border border-border px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/40 focus:outline-none"
            />
          </label>
          <label className="w-full md:w-48">
            <span className="text-xs uppercase tracking-wider text-muted block mb-1">District</span>
            <select
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              className="w-full rounded-md bg-slate-900/80 border border-border px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/40 focus:outline-none"
            >
              <option value="all">All</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={hasTestimonyOnly}
            onChange={(event) => setHasTestimonyOnly(event.target.checked)}
            className="h-4 w-4 rounded border-border bg-slate-900"
          />
          Show villages with survivor testimony
        </label>

        <div className="text-xs text-muted uppercase tracking-wider">
          Showing {results.length} of {villages.length} villages.
        </div>

        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {results.map((village) => (
            <li key={village.id}>
              <button
                type="button"
                className="w-full text-left bg-slate-900/60 border border-border/40 rounded-lg px-4 py-3 hover:border-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none"
                onClick={() => {
                  onSelectVillage(village);
                  onClose();
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg text-white font-semibold">{village.names.en}</p>
                    <p className="text-sm text-text-secondary">{village.names.ar}</p>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted">
                    {village.district} District
                  </div>
                </div>
                <p className="text-sm text-muted mt-2 max-h-24 overflow-hidden">
                  {village.narrative.summary}
                </p>
                {village.testimonies.length > 0 && (
                  <p className="text-xs text-emerald-300 mt-2 uppercase tracking-wider">
                    Contains survivor testimony
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default ArchiveExplorerModal;
