import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Village } from '../data/types';

interface CodexModalProps {
  village?: Village | null;
  onClose: () => void;
}

const joinList = (values: (string | undefined)[]) =>
  values.filter(Boolean).join(', ');

const CodexModal: React.FC<CodexModalProps> = ({ village, onClose }) => {
  const { t } = useTranslation();
  const villageDetails = useMemo(() => village ?? null, [village]);

  const englishName =
    villageDetails?.names?.en ??
    villageDetails?.name ??
    t('villages.unknownName');
  const arabicName = villageDetails?.names?.ar ?? villageDetails?.name_arabic;
  const summary =
    villageDetails?.narrative?.summary ??
    villageDetails?.story ??
    villageDetails?.overview ??
    '';
  const district =
    villageDetails?.district ?? t('villages.unknownDistrict');
  const destroyedBy = joinList([
    villageDetails?.destroyed_by,
    ...((villageDetails?.destruction?.perpetrators ?? []) as string[]),
  ]);
  const militaryOperation =
    villageDetails?.military_operation ?? villageDetails?.destruction?.operation;
  const builtOn =
    villageDetails?.israeli_settlement ?? villageDetails?.aftermath?.settlement;
  const coordinates = villageDetails?.coordinates
    ? `${villageDetails.coordinates.lat.toFixed(4)}, ${villageDetails.coordinates.lon.toFixed(4)}`
    : villageDetails?.lat && villageDetails?.lon
    ? `${villageDetails.lat.toFixed(4)}, ${villageDetails.lon.toFixed(4)}`
    : null;
  const aftermathNotes = villageDetails?.aftermath?.notes ?? [];
  const keyEvents = villageDetails?.narrative?.key_events ?? [];
  const testimonies = villageDetails?.testimonies ?? [];
  const mediaReferences = villageDetails?.media?.references ?? [];
  const mediaGalleries = villageDetails?.media?.galleries ?? [];
  const mediaMaps = villageDetails?.media?.maps ?? [];

  return (
    <Modal
      isOpen={Boolean(villageDetails)}
      onClose={onClose}
      title={villageDetails ? englishName : t('modals.codex.title')}
    >
      {villageDetails ? (
        <div className="space-y-4">
        {arabicName ? (
          <div>
            <h4 className="font-sans text-xl text-text-secondary">{arabicName}</h4>
          </div>
        ) : null}
        {summary ? (
          <div className="border-t border-border pt-4 text-text-secondary space-y-4">
            <p className="leading-relaxed">{summary}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-tertiary border-t border-border pt-4">
          <p>
            <strong className="text-text-secondary-strong">{t('modals.codex.district')}:</strong> {district}
          </p>
          {destroyedBy && (
            <p>
              <strong className="text-text-secondary-strong">{t('modals.codex.destroyedBy')}:</strong> {destroyedBy}
            </p>
          )}
          {militaryOperation && (
            <p>
              <strong className="text-text-secondary-strong">{t('modals.codex.militaryOperation')}:</strong> {militaryOperation}
            </p>
          )}
          {builtOn && (
            <p>
              <strong className="text-text-secondary-strong">{t('modals.codex.builtOn')}:</strong> {builtOn}
            </p>
          )}
          {coordinates && (
            <p>
              <strong className="text-text-secondary-strong">{t('modals.codex.coordinates')}:</strong> {coordinates}
            </p>
          )}
        </div>

        {keyEvents.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('modals.codex.keyFacts')}
            </h5>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              {keyEvents.map((event, index) => (
                <li key={`${villageDetails.id}-event-${index}`}>
                  {event.label ? (
                    <span className="text-text-secondary-strong">{event.label}:</span>
                  ) : null}{' '}
                  {event.value}
                </li>
              ))}
            </ul>
          </div>
        )}

        {aftermathNotes.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('modals.codex.aftermath')}
            </h5>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              {aftermathNotes.map((note, index) => (
                <li key={`${villageDetails.id}-aftermath-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {testimonies.length > 0 && (
          <div className="pt-4 border-t border-border space-y-4">
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('modals.codex.testimonies')}
            </h5>
            {testimonies.map((testimony) => (
              <figure
                key={`${villageDetails.id}-${testimony.witness}`}
                className="space-y-2"
              >
                <blockquote className="italic text-text-secondary">
                  “{testimony.quote}”
                </blockquote>
                <figcaption className="text-xs text-text-tertiary">
                  — {testimony.witness}
                  {testimony.source?.title ? (
                    <>
                      {', '}
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
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {(mediaReferences.length > 0 || mediaGalleries.length > 0 || mediaMaps.length > 0) && (
          <div className="pt-4 border-t border-border space-y-3">
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('modals.codex.media')}
            </h5>
            <ul className="space-y-2 text-sm text-text-secondary">
              {[...mediaReferences, ...mediaGalleries, ...mediaMaps].map((item) => (
                <li key={`${villageDetails.id}-${item.title}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link inline"
                  >
                    {item.title}
                  </a>
                  {item.type && (
                    <span className="text-xs uppercase tracking-wider text-text-tertiary"> [{item.type}]</span>
                  )}
                  {item.credit && (
                    <span className="text-xs text-text-tertiary"> · {item.credit}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

          <div className="pt-4 border-t border-border">
            <a
              className="resource-link"
              href={`/atlas.html?village=${encodeURIComponent(englishName)}`}
            >
              {t('modals.codex.viewAtlas')}
            </a>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CodexModal;
