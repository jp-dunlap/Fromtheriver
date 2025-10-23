import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SceneOverlay from '../components/SceneOverlay';
import SceneAudioControls from '../components/SceneAudioControls';
import type { Village } from '../data/types';
import { generateAmbientToneDataUri } from '../js/ambientTone';

const sampleVillages: Village[] = [
  {
    id: 1,
    name: 'Lifta',
    name_arabic: 'لفتا',
    lat: 31.789,
    lon: 35.213,
    district: 'Jerusalem',
    story:
      'One of the few depopulated Palestinian villages that remains partially intact. Lifta was emptied in 1948 after sustaining repeated attacks from Zionist militias. The stone homes still look down upon Jerusalem as a reminder of the people who were forced from them.',
    military_operation: 'Operation Nachshon',
    destroyed_by: 'Irgun & Haganah',
    israeli_settlement: 'Jerusalem (expansion)',
  },
  {
    id: 2,
    name: 'Deir Yassin',
    name_arabic: 'دير ياسين',
    lat: 31.778,
    lon: 35.187,
    district: 'Jerusalem',
    story:
      'The site of the infamous April 9, 1948 massacre that became a turning point in the Nakba. Survivors were expelled and the village was destroyed; a psychiatric hospital now stands on its lands.',
    destroyed_by: 'Irgun & Lehi',
    israeli_settlement: 'Givat Shaul',
  },
];

const PrototypeGallery: React.FC = () => {
  const [isOverlayVisible, setOverlayVisible] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ambientTone = useMemo(
    () =>
      generateAmbientToneDataUri({
        baseFrequency: 198,
        layers: [
          { ratio: 1, gain: 1 },
          { ratio: 1.5, gain: 0.45, phase: 0.25 },
          { ratio: 2, gain: 0.2, phase: 0.4 },
        ],
        duration: 2.8,
        attackPortion: 0.1,
        releasePortion: 0.25,
      }),
    []
  );

  useEffect(() => {
    const audioElement = new Audio(ambientTone);
    audioElement.loop = true;
    audioRef.current = audioElement;

    return () => {
      audioElement.pause();
      audioRef.current = null;
    };
  }, [ambientTone]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlay = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.warn('Unable to play prototype audio', error);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((previous) => {
      const next = !previous;
      if (next && !isPlaying) {
        void handlePlay();
      }
      if (!next && isPlaying) {
        handlePause();
      }
      return next;
    });
  }, [handlePause, handlePlay, isPlaying]);

  const audioState = useMemo(
    () => ({
      isPlaying,
      volume,
    }),
    [isPlaying, volume]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 py-10 border-b border-border/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <h1 className="text-3xl font-serif">Prototype Gallery</h1>
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">
          Lightweight in-app previews replace Storybook while registry access is blocked. Toggle the overlay and audio controls below to simulate scene activation and capture feedback from collaborators.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 text-xs text-text-secondary/80">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isOverlayVisible}
              onChange={(event) => setOverlayVisible(event.target.checked)}
              className="accent-white"
            />
            Show scene overlay
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={toggleAutoPlay}
              className="accent-white"
            />
            Auto play narration on open
          </label>
        </div>
      </header>

      <main className="relative px-6 py-12 md:px-10">
        <div className="max-w-3xl space-y-6">
          <section className="bg-slate-900/40 border border-border/40 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Scene Overlay Preview</h2>
            <p className="text-sm text-text-secondary mb-6">
              Sample data from the Jerusalem district demonstrates how contextual stories appear when a scene becomes active.
            </p>
            <SceneOverlay
              sceneTitle="The Roots"
              description="Follow the colonial timeline from the British Mandate through the Nakba and meet villages whose erasure anchors this archive."
              villages={sampleVillages}
              onSelectVillage={(village) => setSelectedVillage(village)}
              isVisible={isOverlayVisible}
            />
            {selectedVillage && (
              <div className="mt-40 max-w-md rounded-xl bg-slate-900/60 border border-border/40 p-4 text-xs text-text-secondary">
                <p className="text-sm text-white font-semibold">Codex preview · {selectedVillage.name}</p>
                <p className="mt-2 leading-relaxed">{selectedVillage.story}</p>
              </div>
            )}
          </section>

          <section className="bg-slate-900/40 border border-border/40 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Controls Preview</h2>
            <p className="text-sm text-text-secondary mb-6">
              Interact with the accessible narration controls exactly as they appear during a live scene.
            </p>
            <SceneAudioControls
              sceneId="prototype"
              sceneTitle="Roots Narration"
              audioAvailable
              audioState={audioState}
              onPlay={() => {
                void handlePlay();
              }}
              onPause={() => {
                handlePause();
              }}
              onToggleAutoPlay={toggleAutoPlay}
              autoPlay={autoPlay}
              volume={volume}
              onVolumeChange={setVolume}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrototypeGallery;
