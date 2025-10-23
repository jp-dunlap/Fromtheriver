import React from 'react';
import { useTranslation } from 'react-i18next';
import { SceneAudioState } from '../js/riverScenes';

interface SceneAudioControlsProps {
  sceneId: string;
  sceneTitle: string;
  audioAvailable: boolean;
  audioState: SceneAudioState;
  onPlay: (sceneId: string) => void;
  onPause: (sceneId: string) => void;
  onToggleAutoPlay: () => void;
  autoPlay: boolean;
  volume: number;
  onVolumeChange: (value: number) => void;
}

const SceneAudioControls: React.FC<SceneAudioControlsProps> = ({
  sceneId,
  sceneTitle,
  audioAvailable,
  audioState,
  onPlay,
  onPause,
  onToggleAutoPlay,
  autoPlay,
  volume,
  onVolumeChange,
}) => {
  const { t } = useTranslation();

  if (!audioAvailable) {
    return null;
  }

  const handleTogglePlayback = () => {
    if (audioState.isPlaying) {
      onPause(sceneId);
    } else {
      onPlay(sceneId);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-4 md:right-8 z-30 w-[90vw] md:w-80 bg-slate-950/85 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl p-4 text-sm text-text-secondary"
      role="region"
      aria-label={t('audio.narration') + ': ' + sceneTitle}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-tertiary">
            {t('audio.narration')}
          </p>
          <h4 className="text-base text-white font-semibold">{sceneTitle}</h4>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          onClick={handleTogglePlayback}
          aria-pressed={audioState.isPlaying}
          aria-label={
            audioState.isPlaying ? t('audio.pause') : t('audio.play')
          }
        >
          <span aria-hidden="true" className="inline-flex items-center justify-center">
            {audioState.isPlaying ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.5 5.5a1 1 0 011.58-.814l6 4.5a1 1 0 010 1.628l-6 4.5A1 1 0 016 15.5v-10a1 1 0 01.5-.866z" />
              </svg>
            )}
          </span>
          {audioState.isPlaying ? t('audio.pause') : t('audio.play')}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`scene-volume-${sceneId}`} className="text-xs text-text-tertiary">
            {t('audio.volume')}
          </label>
          <input
            id={`scene-volume-${sceneId}`}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            className="w-32 accent-white"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            aria-label={t('audio.volume')}
          />
        </div>
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border/40 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-pressed={autoPlay}
          onClick={onToggleAutoPlay}
        >
          <span aria-hidden="true" className="inline-flex items-center justify-center">
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M4 4a1 1 0 011.707-.707l3 3a1 1 0 010 1.414l-3 3A1 1 0 014 9.586V4zm8.293-.707A1 1 0 0011 4v5.586a1 1 0 001.707.707l3-3a1 1 0 000-1.414l-3-3zM5 14a1 1 0 100 2h10a1 1 0 100-2H5z" />
            </svg>
          </span>
          {autoPlay ? t('audio.disableAuto') : t('audio.enableAuto')}
        </button>
      </div>
    </div>
  );
};

export default SceneAudioControls;
