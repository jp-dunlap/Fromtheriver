import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Village } from '../data/types';

interface CodexModalProps {
  village?: Village | null;
  onClose: () => void;
}

const CodexModal: React.FC<CodexModalProps> = ({ village, onClose }) => {
  const { t } = useTranslation();
  const villageDetails = useMemo(() => village ?? null, [village]);

  return (
    <Modal
      isOpen={Boolean(villageDetails)}
      onClose={onClose}
      title={villageDetails ? villageDetails.name : t('modals.codex.title')}
    >
      {villageDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-sans text-xl text-text-secondary">{villageDetails.name_arabic}</h4>
          </div>
          <div className="border-t border-border pt-4 text-text-secondary space-y-4">
            <p className="leading-relaxed">{villageDetails.story}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-tertiary">
              <p>
                <strong className="text-text-secondary-strong">{t('modals.codex.district')}:</strong> {villageDetails.district}
              </p>
              <p>
                <strong className="text-text-secondary-strong">{t('modals.codex.destroyedBy')}:</strong> {villageDetails.destroyed_by}
              </p>
              {villageDetails.military_operation && (
                <p>
                  <strong className="text-text-secondary-strong">{t('modals.codex.militaryOperation')}:</strong> {villageDetails.military_operation}
                </p>
              )}
              {villageDetails.israeli_settlement && (
                <p>
                  <strong className="text-text-secondary-strong">{t('modals.codex.builtOn')}:</strong> {villageDetails.israeli_settlement}
                </p>
              )}
            </div>
            <div className="pt-4 border-t border-border">
              <a className="resource-link" href={`/atlas.html?village=${encodeURIComponent(villageDetails.name)}`}>
                {t('modals.codex.viewAtlas')}
              </a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CodexModal;
