import React from 'react';
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
    <div className="fixed bottom-6 right-4 md:right-8 z-30 w-[90vw] md:w-80 bg-slate-950/85 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl p-4 text-sm text-text-secondary" role="region" aria-label={`${sceneTitle} audio controls`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Narration</p>
          <h4 className="text-base text-white font-semibold">{sceneTitle}</h4>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          onClick={handleTogglePlayback}
        >
          {audioState.isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`scene-volume-${sceneId}`} className="text-xs text-muted">
            Volume
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
          />
        </div>
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border/40 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-pressed={autoPlay}
          onClick={onToggleAutoPlay}
        >
          {autoPlay ? 'Disable Auto Narration' : 'Enable Auto Narration'}
        </button>
      </div>
    </div>
  );
};

export default SceneAudioControls;
