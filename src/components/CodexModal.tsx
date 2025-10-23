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
      title={villageDetails ? villageDetails.name : 'Codex'}
    >
      {villageDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-sans text-xl text-text-secondary">{villageDetails.name_arabic}</h4>
          </div>
          <div className="border-t border-border pt-4 text-gray-300 space-y-4">
            <p className="leading-relaxed">{villageDetails.story}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted">
              <p>
                <strong className="text-gray-400">District:</strong> {villageDetails.district}
              </p>
              <p>
                <strong className="text-gray-400">Destroyed by:</strong> {villageDetails.destroyed_by}
              </p>
              {villageDetails.military_operation && (
                <p>
                  <strong className="text-gray-400">Military Operation:</strong> {villageDetails.military_operation}
                </p>
              )}
              {villageDetails.israeli_settlement && (
                <p>
                  <strong className="text-gray-400">Built on its ruins:</strong> {villageDetails.israeli_settlement}
                </p>
              )}
            </div>
            <div className="pt-4 border-t border-border">
              <a className="resource-link" href={`/atlas.html?village=${encodeURIComponent(villageDetails.name)}`}>
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
