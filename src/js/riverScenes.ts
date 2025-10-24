
import { MutableRefObject, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface SceneCallbacks {
  onEnter?: (detail: SceneDetail) => void;
  onExit?: (detail: SceneDetail) => void;
}

export interface SceneConfig extends SceneCallbacks {
  id: string;
  element: HTMLElement;
}

export interface SceneDefinition extends SceneCallbacks {
  id: string;
  ref: RefObject<HTMLElement> | MutableRefObject<HTMLElement | null>;
  audioSrc?: string;
}

export interface SceneDetail {
  id: string;
  element: HTMLElement;
  entry: IntersectionObserverEntry;
}

interface ObservedScene extends SceneConfig {
  isVisible: boolean;
  lastEntry?: IntersectionObserverEntry;
}

export class RiverScenesController {
  private observer: IntersectionObserver;
  private scenes = new Map<Element, ObservedScene>();
  private activeSceneId: string | null = null;
  private listeners = new Set<(sceneId: string | null, detail: SceneDetail | null) => void>();

  constructor(options: IntersectionObserverInit = { threshold: 0.35, rootMargin: '0px 0px -20%' }) {
    this.observer = new IntersectionObserver(this.handleEntries, options);
  }

  private handleEntries = (entries: IntersectionObserverEntry[]) => {
    let candidate: { scene: ObservedScene; entry: IntersectionObserverEntry } | null = null;

    entries.forEach((entry) => {
      const scene = this.scenes.get(entry.target);
      if (!scene) return;

      scene.isVisible = entry.isIntersecting;
      scene.lastEntry = entry;
      const detail: SceneDetail = { id: scene.id, element: scene.element, entry };

      if (entry.isIntersecting) {
        scene.onEnter?.(detail);
        if (!candidate || entry.intersectionRatio > candidate.entry.intersectionRatio) {
          candidate = { scene, entry };
        }
      } else {
        scene.onExit?.(detail);
      }
    });

    if (!candidate) {
      const visible = Array.from(this.scenes.values()).filter((scene) => scene.isVisible && scene.lastEntry);
      if (visible.length > 0) {
        visible.sort(
          (a, b) => (b.lastEntry?.intersectionRatio ?? 0) - (a.lastEntry?.intersectionRatio ?? 0)
        );
        const top = visible[0];
        if (top.lastEntry) {
          candidate = { scene: top, entry: top.lastEntry };
        }
      }
    }

    const nextId = candidate ? candidate.scene.id : null;
    if (nextId !== this.activeSceneId) {
      this.activeSceneId = nextId;
      const detail = candidate
        ? { id: candidate.scene.id, element: candidate.scene.element, entry: candidate.entry }
        : null;
      this.emit(nextId, detail);
    }
  };

  private emit(sceneId: string | null, detail: SceneDetail | null) {
    this.listeners.forEach((listener) => listener(sceneId, detail));
  }

  registerScene(config: SceneConfig) {
    if (this.scenes.has(config.element)) {
      this.observer.unobserve(config.element);
    }

    const observed: ObservedScene = { ...config, isVisible: false };
    this.scenes.set(config.element, observed);
    this.observer.observe(config.element);
  }

  unregisterScene(element: HTMLElement) {
    const scene = this.scenes.get(element);
    if (!scene) return;
    this.observer.unobserve(element);
    this.scenes.delete(element);
    if (this.activeSceneId === scene.id) {
      this.activeSceneId = null;
      this.emit(null, null);
    }
  }

  disconnect() {
    this.observer.disconnect();
    this.scenes.clear();
    this.activeSceneId = null;
  }

  onChange(listener: (sceneId: string | null, detail: SceneDetail | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export interface SceneAudioState {
  isPlaying: boolean;
  volume: number;
}

export interface UseRiverScenesResult {
  activeSceneId: string | null;
  playSceneAudio: (sceneId: string) => Promise<void>;
  pauseSceneAudio: (sceneId?: string) => void;
  toggleAutoPlay: () => void;
  autoPlay: boolean;
  setVolume: (value: number) => void;
  getSceneAudioState: (sceneId: string) => SceneAudioState;
  volume: number;
}

export interface UseRiverScenesConfig extends SceneDefinition {
  order: number;
}

const DEFAULT_VOLUME = 0.7;

export function useRiverScenes(
  configs: UseRiverScenesConfig[],
  options?: IntersectionObserverInit
): UseRiverScenesResult {
  const controllerRef = useRef<RiverScenesController | null>(null);
  const audioMapRef = useRef(new Map<string, HTMLAudioElement>());
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);

  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.order - b.order),
    [configs]
  );

  const playScene = useCallback(
    async (sceneId: string) => {
      const audio = audioMapRef.current.get(sceneId);
      if (!audio) return;

      audioMapRef.current.forEach((entry, key) => {
        if (key !== sceneId) {
          entry.pause();
        }
      });

      audio.volume = volume;

      try {
        await audio.play();
        setPlayingSceneId(sceneId);
      } catch (error) {
        console.warn('Unable to start scene audio', error);
      }
    },
    [volume]
  );

  useEffect(() => {
    controllerRef.current?.disconnect();

    controllerRef.current = new RiverScenesController(
      options ?? { threshold: 0.35, rootMargin: '0px 0px -20%' }
    );

    const controller = controllerRef.current;
    const cleanup = controller.onChange((sceneId) => {
      setActiveSceneId(sceneId);
      if (!sceneId) {
        return;
      }
      if (autoPlay && audioMapRef.current.has(sceneId)) {
        void playScene(sceneId);
      }
    });

    sortedConfigs.forEach((config) => {
      const element = config.ref.current;
      if (!element) {
        return;
      }

      controller.registerScene({
        id: config.id,
        element,
        onEnter: config.onEnter,
        onExit: config.onExit,
      });

      if (config.audioSrc && !audioMapRef.current.has(config.id)) {
        const audio = new Audio(config.audioSrc);
        audio.loop = true;
        audio.volume = volume;
        audioMapRef.current.set(config.id, audio);
      }
    });

    return () => {
      cleanup();
      controller.disconnect();
    };
  }, [sortedConfigs, options, autoPlay, playScene, volume]);

  useEffect(() => {
    audioMapRef.current.forEach((audio) => {
      audio.volume = volume;
    });
  }, [volume]);

  useEffect(() => {
    const audioMap = audioMapRef.current;
    const controller = controllerRef.current;

    return () => {
      audioMap.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioMap.clear();
      controller?.disconnect();
    };
  }, []);

  const pauseSceneAudio = useCallback(
    (sceneId?: string) => {
      if (sceneId) {
        const audio = audioMapRef.current.get(sceneId);
        if (audio) {
          audio.pause();
        }
        if (playingSceneId === sceneId) {
          setPlayingSceneId(null);
        }
        return;
      }

      audioMapRef.current.forEach((audio) => audio.pause());
      setPlayingSceneId(null);
    },
    [playingSceneId]
  );

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((previous) => !previous);
  }, []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
  }, []);

  const getSceneAudioState = useCallback(
    (sceneId: string): SceneAudioState => ({
      isPlaying: playingSceneId === sceneId,
      volume,
    }),
    [playingSceneId, volume]
  );

  return {
    activeSceneId,
    playSceneAudio: playScene,
    pauseSceneAudio,
    toggleAutoPlay,
    autoPlay,
    setVolume,
    getSceneAudioState,
    volume,
  };
}

export function resolveSceneElements(configs: SceneDefinition[]): SceneConfig[] {
  return configs
    .map((config) => {
      const element = config.ref.current ?? null;
      return element
        ? {
            id: config.id,
            element,
            onEnter: config.onEnter,
            onExit: config.onExit,
          }
        : null;
    })
    .filter((config): config is SceneConfig => Boolean(config));
}
