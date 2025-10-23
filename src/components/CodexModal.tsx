import React, { useMemo } from 'react';
import Modal from './Modal';
import { Village } from '../data/types';

interface CodexModalProps {
  village?: Village | null;
  onClose: () => void;
}

const CodexModal: React.FC<CodexModalProps> = ({ village, onClose }) => {
  const villageDetails = useMemo(() => village ?? null, [village]);

  return (
    <Modal
      isOpen={Boolean(villageDetails)}
      onClose={onClose}
      title={villageDetails ? villageDetails.names.en : 'Codex'}
    >
      {villageDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-sans text-xl text-text-secondary">{villageDetails.names.ar}</h4>
          </div>
          <div className="border-t border-border pt-4 text-gray-300 space-y-4">
            <p className="leading-relaxed">{villageDetails.narrative.summary}</p>
            {villageDetails.narrative.key_events.length > 0 && (
              <div className="pt-2">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Key Facts
                </h5>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {villageDetails.narrative.key_events.map((event) => (
                    <li key={`${villageDetails.slug}-${event.label}-${event.value}`}>
                      <span className="text-text-secondary">{event.label}:</span> {event.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted">
              <p>
                <strong className="text-gray-400">District:</strong> {villageDetails.district}
              </p>
              <p>
                <strong className="text-gray-400">Coordinates:</strong>{' '}
                {villageDetails.coordinates.lat.toFixed(4)}, {villageDetails.coordinates.lon.toFixed(4)}
              </p>
              {villageDetails.destruction.perpetrators.length > 0 && (
                <p>
                  <strong className="text-gray-400">Perpetrators:</strong>{' '}
                  {villageDetails.destruction.perpetrators.join(', ')}
                </p>
              )}
              {villageDetails.destruction.operation && (
                <p>
                  <strong className="text-gray-400">Military Operation:</strong> {villageDetails.destruction.operation}
                </p>
              )}
              {villageDetails.aftermath.settlement && (
                <p>
                  <strong className="text-gray-400">Built on its ruins:</strong> {villageDetails.aftermath.settlement}
                </p>
              )}
            </div>
            {villageDetails.aftermath.notes.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Aftermath
                </h5>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {villageDetails.aftermath.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
            {villageDetails.testimonies.length > 0 && (
              <div className="pt-4 border-t border-border space-y-4">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Survivor Testimonies
                </h5>
                {villageDetails.testimonies.map((testimony) => (
                  <figure key={`${villageDetails.slug}-${testimony.witness}`} className="space-y-2">
                    <blockquote className="italic text-text-secondary">
                      “{testimony.quote}”
                    </blockquote>
                    <figcaption className="text-xs text-muted">
                      — {testimony.witness}
                      {testimony.source?.title && (
                        <>
                          {', '}from{' '}
                          {testimony.source.url ? (
                            <a
                              href={testimony.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {testimony.source.title}
                            </a>
                          ) : (
                            testimony.source.title
                          )}
                        </>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {(villageDetails.media.references.length > 0 ||
              villageDetails.media.galleries.length > 0 ||
              villageDetails.media.maps.length > 0) && (
              <div className="pt-4 border-t border-border space-y-3">
                <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Media & Further Study
                </h5>
                <ul className="space-y-2 text-sm text-muted">
                  {[...villageDetails.media.references, ...villageDetails.media.galleries, ...villageDetails.media.maps].map(
                    (item) => (
                      <li key={`${villageDetails.slug}-${item.title}`}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="resource-link inline">
                          {item.title}
                        </a>{' '}
                        <span className="text-xs uppercase tracking-wider text-muted">[{item.type}]</span>
                        {item.credit && <span className="text-xs text-muted"> · {item.credit}</span>}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <a
                className="resource-link"
                href={`/atlas.html?village=${encodeURIComponent(villageDetails.names.en)}`}
              >
                View on Atlas of Erasure →
              </a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CodexModal;
