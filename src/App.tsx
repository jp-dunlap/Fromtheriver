import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import RiverPath from "./components/RiverPath";
import ContentNode from "./components/ContentNode";
import AccordionItem from "./components/AccordionItem";
import VillageTicker from "./components/VillageTicker";
import Modal from "./components/Modal";
import { TooltipProvider, TooltipTrigger } from "./components/TooltipProvider";
import { Village } from "./data/types";
import { VillageLink } from "./components/VillageLink";
import SceneOverlay from "./components/SceneOverlay";
import SceneAudioControls from "./components/SceneAudioControls";
import { useRiverScenes, UseRiverScenesConfig } from "./js/riverScenes";
import { generateAmbientToneDataUri } from "./js/ambientTone";
import PrototypeGallery from "./prototypes/PrototypeGallery";
import { villages as villagesData, villagesDataset } from "./data/villages";
import ExternalUpdatesPanel from "./components/ExternalUpdatesPanel";
import type { ExternalArchivePayload } from "./data/external";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { Trans, useTranslation } from "react-i18next";
import Meta from "./seo/meta";
import { initArchiveDeepLink, updateArchiveDeepLink } from "./lib/deeplink";

const ArchiveExplorerModal = React.lazy(
  () => import("./components/ArchiveExplorerModal"),
);
const CodexModal = React.lazy(() => import("./components/CodexModal"));

type SceneId = "roots" | "resistance" | "culture" | "action";

interface SceneMetadata {
  id: SceneId;
  title: string;
  description: string;
  ref: React.MutableRefObject<HTMLElement | null>;
  audioSrc: string;
  order: number;
  focusVillages: string[];
}

interface OpenVillageOptions {
  replace?: boolean;
  fromDeepLink?: boolean;
  preserveLocation?: boolean;
}

const App: React.FC = () => {
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const rootsRef = useRef<HTMLElement | null>(null);
  const resistanceRef = useRef<HTMLElement | null>(null);
  const cultureRef = useRef<HTMLElement | null>(null);
  const actionRef = useRef<HTMLElement | null>(null);

  const isPrototypeMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("prototype") === "gallery";

  const allowOverlay = useMemo(() => {
    if (typeof window === "undefined") return false;
    const q = new URLSearchParams(window.location.search);
    const val = q.get("overlay");
    return val === "1" || val === "true";
  }, []);

  const [villages, setVillages] = useState<Village[]>(() =>
    isPrototypeMode ? [] : villagesData,
  );
  const [villagesErrorCode, setVillagesErrorCode] = useState<
    "prototype" | "empty" | null
  >(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [isToolkitOpen, setToolkitOpen] = useState(false);
  const [isDonateOpen, setDonateOpen] = useState(false);
  const [isArchiveExplorerOpen, setArchiveExplorerOpen] = useState(false);
  const [externalUpdates, setExternalUpdates] =
    useState<ExternalArchivePayload | null>(null);
  const [externalUpdatesErrorCode, setExternalUpdatesErrorCode] = useState<
    "load" | null
  >(null);
  const [isExternalUpdatesLoading, setExternalUpdatesLoading] = useState(false);
  const { t, i18n } = useTranslation(["common", "app"]);
  const deepLinkOriginRef = useRef(false);
  // holds the latest open-by-slug callback to avoid TDZ and stale closures
  const openBySlugRef = useRef<
    (slug: string, options?: OpenVillageOptions) => Village | null
  >(() => null);
  const activeLocale = i18n.resolvedLanguage ?? i18n.language;
  const generatedDate = useMemo(
    () =>
      new Date(villagesDataset.metadata.generated_at).toLocaleDateString(
        activeLocale,
      ),
    [activeLocale],
  );
  const formattedVillageCount = useMemo(
    () => villages.length.toLocaleString(activeLocale),
    [villages.length, activeLocale],
  );
  const villagesStatusMessage = useMemo(() => {
    if (villagesErrorCode === "prototype") {
      return t("common:status.dataError");
    }
    if (villagesErrorCode === "empty") {
      return t("common:status.dataEmpty");
    }
    return t("common:status.dataRefresh", {
      date: generatedDate,
      count: formattedVillageCount,
    });
  }, [villagesErrorCode, t, generatedDate, formattedVillageCount]);
  const villagesStatusIsError = villagesErrorCode !== null;
  const externalUpdatesErrorMessage = externalUpdatesErrorCode
    ? t("common:status.externalError")
    : null;

  const loadExternalUpdates = useCallback(
    async (signal?: AbortSignal) => {
      if (isPrototypeMode) {
        return;
      }

      setExternalUpdatesLoading(true);
      setExternalUpdatesErrorCode(null);

      try {
        const response = await fetch("/.netlify/functions/external-archive", {
          signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const payload = (await response.json()) as ExternalArchivePayload;
        if (signal?.aborted) {
          return;
        }
        setExternalUpdates(payload);
        setExternalUpdatesErrorCode(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        console.error("Failed to load external archive updates", error);

        try {
          const fallbackResponse = await fetch("/data/external-archive.json", {
            signal,
          });
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback HTTP error: ${fallbackResponse.status}`);
          }

          const fallbackPayload =
            (await fallbackResponse.json()) as ExternalArchivePayload;
          if (signal?.aborted) {
            return;
          }

          setExternalUpdates(fallbackPayload);
          setExternalUpdatesErrorCode(null);
          return;
        } catch (fallbackError) {
          if (!signal?.aborted) {
            console.error(
              "Falling back to cached external archive failed",
              fallbackError,
            );
          }
        }

        setExternalUpdatesErrorCode("load");
      } finally {
        if (!signal?.aborted) {
          setExternalUpdatesLoading(false);
        }
      }
    },
    [isPrototypeMode],
  );

  useEffect(() => {
    if (isPrototypeMode) {
      setVillages([]);
      setVillagesErrorCode("prototype");
      return;
    }

    setVillages(villagesData);
    setVillagesErrorCode(villagesData.length === 0 ? "empty" : null);
  }, [isPrototypeMode]);

  useEffect(() => {
    if (isPrototypeMode) {
      setExternalUpdates(null);
      setExternalUpdatesErrorCode(null);
      setExternalUpdatesLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadExternalUpdates(controller.signal);
    return () => {
      controller.abort();
    };
  }, [isPrototypeMode, loadExternalUpdates]);

  const nodeRefs = useMemo(
    () => [rootsRef, resistanceRef, cultureRef, actionRef],
    [],
  );

  const toneSources = useMemo(
    () => ({
      roots: generateAmbientToneDataUri({
        baseFrequency: 174,
        layers: [
          { ratio: 1, gain: 1 },
          { ratio: 2, gain: 0.25, phase: 0.25 },
          { ratio: 2.5, gain: 0.2, phase: 0.35 },
        ],
        duration: 3,
        attackPortion: 0.15,
        releasePortion: 0.25,
      }),
      resistance: generateAmbientToneDataUri({
        baseFrequency: 220,
        layers: [
          { ratio: 1, gain: 1 },
          { ratio: 1.33, gain: 0.4, phase: 0.15 },
          { ratio: 1.66, gain: 0.35, phase: 0.32 },
        ],
        duration: 2.8,
        attackPortion: 0.05,
        releasePortion: 0.3,
      }),
      culture: generateAmbientToneDataUri({
        baseFrequency: 262,
        layers: [
          { ratio: 1, gain: 1 },
          { ratio: 1.5, gain: 0.5, phase: 0.2 },
          { ratio: 2, gain: 0.25, phase: 0.4 },
        ],
        duration: 3.2,
        attackPortion: 0.2,
        releasePortion: 0.25,
      }),
      action: generateAmbientToneDataUri({
        baseFrequency: 196,
        layers: [
          { ratio: 1, gain: 1 },
          { ratio: 2, gain: 0.3, phase: 0.1 },
          { ratio: 2.75, gain: 0.25, phase: 0.28 },
        ],
        duration: 2.4,
        attackPortion: 0.08,
        releasePortion: 0.2,
      }),
    }),
    [],
  );

  const villagesBySlug = useMemo(() => {
    const map = new Map<string, Village>();
    villages.forEach((villageEntry) => {
      map.set(villageEntry.slug.toLowerCase(), villageEntry);
    });
    return map;
  }, [villages]);

  const villagesByName = useMemo(() => {
    const map = new Map<string, Village>();
    villages.forEach((villageEntry) => {
      map.set(villageEntry.names.en.toLowerCase(), villageEntry);
    });
    return map;
  }, [villages]);

  const sceneMeta = useMemo<SceneMetadata[]>(
    () => [
      {
        id: "roots",
        title: t("common:nav.sections.roots"),
        description:
          "Follow the colonial timeline from the British Mandate through the Nakba and meet villages whose erasure anchors this archive.",
        ref: rootsRef,
        audioSrc: toneSources.roots,
        order: 0,
        focusVillages: ["Lifta", "Deir Yassin", "al-Tantura"],
      },
      {
        id: "resistance",
        title: t("common:nav.sections.resistance"),
        description:
          "Witness the breadth of Palestinian defiance, from organized uprisings to the cultural figures who embodied liberation.",
        ref: resistanceRef,
        audioSrc: toneSources.resistance,
        order: 1,
        focusVillages: ["Haifa", "Acre", "Safad"],
      },
      {
        id: "culture",
        title: t("common:nav.sections.culture"),
        description:
          "Celebrate the living practices—tatreez, cuisine, film, and dance—that protect memory and identity against erasure.",
        ref: cultureRef,
        audioSrc: toneSources.culture,
        order: 2,
        focusVillages: ["Jaffa", "Beisan"],
      },
      {
        id: "action",
        title: t("common:nav.sections.action"),
        description:
          "Translate narrative into solidarity through organizing, fundraising, and amplifying Palestinian-led calls to action.",
        ref: actionRef,
        audioSrc: toneSources.action,
        order: 3,
        focusVillages: ["Lydda", "al-Ramla"],
      },
    ],
    [actionRef, cultureRef, resistanceRef, rootsRef, toneSources, t],
  );

  const sceneConfigs = useMemo<UseRiverScenesConfig[]>(
    () =>
      sceneMeta.map(({ id, ref, audioSrc, order }) => ({
        id,
        ref,
        audioSrc,
        order,
      })),
    [sceneMeta],
  );

  const sceneObserverOptions = useMemo<IntersectionObserverInit>(
    () => ({
      threshold: 0.4,
      rootMargin: "-15% 0px -25% 0px",
    }),
    [],
  );

  const {
    activeSceneId,
    playSceneAudio,
    pauseSceneAudio,
    toggleAutoPlay,
    autoPlay,
    setVolume,
    getSceneAudioState,
    volume: audioVolume,
  } = useRiverScenes(sceneConfigs, sceneObserverOptions);

  const activeScene = useMemo(
    () => sceneMeta.find((scene) => scene.id === activeSceneId) ?? null,
    [sceneMeta, activeSceneId],
  );

  const sceneCount = sceneConfigs.length;

  const activeSceneIndex = useMemo(
    () => (activeScene ? activeScene.order : -1),
    [activeScene],
  );

  const activeSceneVillages = useMemo(() => {
    if (!activeScene) {
      return [] as Village[];
    }

    return activeScene.focusVillages
      .map((targetName) => {
        const normalized = targetName.toLowerCase();
        return (
          villagesBySlug.get(normalized) ??
          villagesByName.get(normalized) ??
          null
        );
      })
      .filter((village): village is Village => Boolean(village));
  }, [activeScene, villagesBySlug, villagesByName]);

  const activeAudioState = useMemo(
    () =>
      activeScene
        ? getSceneAudioState(activeScene.id)
        : { isPlaying: false, volume: audioVolume },
    [activeScene, getSceneAudioState, audioVolume],
  );

  useEffect(() => {
    sceneMeta.forEach((scene) => {
      const element = scene.ref.current;
      if (!element) return;
      element.dataset.sceneActive =
        activeSceneId === scene.id ? "true" : "false";
    });
  }, [sceneMeta, activeSceneId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setArchiveExplorerOpen(true);
      }
      if (
        !event.metaKey &&
        !event.ctrlKey &&
        event.key === "/" &&
        !isArchiveExplorerOpen
      ) {
        event.preventDefault();
        setArchiveExplorerOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [isArchiveExplorerOpen]);

  const syncDeepLink = useCallback(
    (
      slug: string | null,
      options: { replace?: boolean; preserveLocation?: boolean } = {},
    ) => {
      if (typeof window === "undefined") {
        return;
      }

      const shouldPreserve = options.preserveLocation ?? false;
      if (!shouldPreserve) {
        updateArchiveDeepLink(slug, { replace: options.replace });
        return;
      }

      const url = new URL(window.location.href);
      const method: "replaceState" | "pushState" = options.replace
        ? "replaceState"
        : "pushState";

      if (slug) {
        url.searchParams.set("slug", slug);
      } else {
        url.searchParams.delete("slug");
      }

      const query = url.searchParams.toString();
      const next = query ? `${url.pathname}?${query}` : url.pathname;
      window.history[method](null, "", next);
    },
    [],
  );

  const openVillage = useCallback(
    (village: Village, options: OpenVillageOptions = {}) => {
      setSelectedVillage(village);
      deepLinkOriginRef.current = options.fromDeepLink ?? false;
      syncDeepLink(village.slug, {
        replace: options.replace,
        preserveLocation: options.preserveLocation,
      });
    },
    [syncDeepLink],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const { pathname } = window.location;
    const shouldInit = pathname.startsWith("/archive");
    if (!shouldInit) {
      return;
    }

    const stop = initArchiveDeepLink((slug) => {
      if (!slug) {
        setSelectedVillage(null);
        deepLinkOriginRef.current = false;
        return;
      }

      const result = openBySlugRef.current(slug, {
        replace: true,
        fromDeepLink: true,
        preserveLocation: false,
      });

      if (result) {
        return;
      }

      updateArchiveDeepLink(null, { replace: true });
      setSelectedVillage(null);
      deepLinkOriginRef.current = false;
    });

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      const slug = detail?.slug;
      if (!slug) {
        return;
      }

      // call the latest function without reading a TDZ variable during render
      openBySlugRef.current(slug);
    };

    window.addEventListener("codex:open", onOpen as EventListener);
    return () => {
      window.removeEventListener("codex:open", onOpen as EventListener);
    };
    // no deps: we use the ref on runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVillageOpenBySlug = useCallback(
    (slug: string, options: OpenVillageOptions = {}) => {
      const normalizedSlug = slug?.trim().toLowerCase();
      if (!normalizedSlug) {
        return null;
      }

      const match = villagesBySlug.get(normalizedSlug);
      if (!match) {
        console.warn(`Archive entry not found for slug: ${slug}`);
        return null;
      }

      openVillage(match, options);
      return match;
    },
    [openVillage, villagesBySlug],
  );

  useEffect(() => {
    openBySlugRef.current = handleVillageOpenBySlug;
  }, [handleVillageOpenBySlug]);

  const handleVillageOpen = useCallback(
    (village: Village) => {
      openVillage(village);
    },
    [openVillage],
  );

  const renderVillageLink = useCallback(
    (identifier: string) => {
      const normalized = identifier.toLowerCase();
      const villageEntry =
        villagesBySlug.get(normalized) ?? villagesByName.get(normalized);
      if (!villageEntry) {
        return <span className="font-semibold">{identifier}</span>;
      }
      return (
        <VillageLink village={villageEntry} onSelect={handleVillageOpen} />
      );
    },
    [villagesBySlug, villagesByName, handleVillageOpen],
  );

  const closeCodex = useCallback(() => {
    setSelectedVillage(null);
    syncDeepLink(null, {
      replace: deepLinkOriginRef.current,
    });
    deepLinkOriginRef.current = false;
  }, [syncDeepLink]);

  const handleAutoPlayToggle = useCallback(() => {
    const willEnable = !autoPlay;
    toggleAutoPlay();
    if (willEnable) {
      if (activeSceneId) {
        void playSceneAudio(activeSceneId);
      }
    } else {
      pauseSceneAudio();
    }
  }, [
    autoPlay,
    toggleAutoPlay,
    activeSceneId,
    playSceneAudio,
    pauseSceneAudio,
  ]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolume(value);
    },
    [setVolume],
  );

  const renderModals = () => (
    <>
      <Suspense fallback={null}>
        {isArchiveExplorerOpen ? (
          <ArchiveExplorerModal
            villages={villages}
            isOpen={isArchiveExplorerOpen}
            onClose={() => setArchiveExplorerOpen(false)}
            onSelectVillage={handleVillageOpen}
          />
        ) : null}
      </Suspense>

      <Suspense fallback={null}>
        {selectedVillage ? (
          <CodexModal village={selectedVillage} onClose={closeCodex} />
        ) : null}
      </Suspense>

      <Modal
        isOpen={isToolkitOpen}
        onClose={() => setToolkitOpen(false)}
        title={t("common:modals.toolkit.title")}
      >
        <p className="text-text-secondary mb-6">
          {t("common:modals.toolkit.description")}
        </p>
        <ul className="space-y-4">
          <li>
            <a
              href="https://palianswers.com/"
              className="resource-link text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              PaliAnswers: Indexed Responses
            </a>
          </li>
          <li>
            <a
              href="https://decolonizepalestine.com/myths/"
              className="resource-link text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Decolonize Palestine: Debunking Myths
            </a>
          </li>
        </ul>
      </Modal>

      <Modal
        isOpen={isDonateOpen}
        onClose={() => setDonateOpen(false)}
        title={t("common:modals.donate.title")}
      >
        <p className="text-text-secondary mb-8">
          {t("common:modals.donate.description")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h4 className="font-serif text-xl text-white mb-3 border-b border-border pb-2">
              {t("common:modals.donate.direct")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://docs.google.com/spreadsheets/d/1vtMLLOzuc6GpkFySyVtKQOY2j-Vvg0UsChMCFst_WLA/htmlview"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Operation Olive Branch
                </a>
                <p className="text-sm text-muted mt-1">
                  Volunteer-powered grassroots effort helping Palestinian
                  families. Prioritizes transparency.
                </p>
              </li>
              <li>
                <a
                  href="https://linktr.ee/fundsforgaza"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Funds For Gaza
                </a>
                <p className="text-sm text-muted mt-1">
                  List of targeted fundraisers for Gaza, curated by the
                  @letstalkpalestine activist collective.
                </p>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/p/C03zzwUvClA/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  e-SIMs for Gaza
                </a>
                <p className="text-sm text-muted mt-1">
                  Activist guide on how to donate a Nomad e-SIM and keep
                  Palestinians in Gaza connected.
                </p>
              </li>
              <li>
                <a
                  href="https://www.bonfire.com/arkansas-fundraiser-for-palestine/"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Local Mutual Aid
                </a>
                <p className="text-sm text-muted mt-1">
                  Example of community-level organizing (Arkansas) directly
                  supporting relief efforts.
                </p>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-xl text-white mb-3 border-b border-border pb-2">
              {t("common:modals.donate.institutional")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://www.pcrf.net/"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PCRF
                </a>
                <p className="text-sm text-muted mt-1">
                  Palestine Children's Relief Fund. Provides critical medical
                  care to sick and injured children.
                </p>
              </li>
              <li>
                <a
                  href="https://www.map.org.uk/"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MAP
                </a>
                <p className="text-sm text-muted mt-1">
                  Medical Aid for Palestinians. Delivers health and dignity to
                  Palestinians under occupation and as refugees.
                </p>
              </li>
              <li>
                <a
                  href="https://www.doctorswithoutborders.org/"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Doctors Without Borders
                </a>
                <p className="text-sm text-muted mt-1">
                  Global medical teams providing emergency care in Gaza and the
                  West Bank.
                </p>
              </li>
              <li>
                <a
                  href="https://donate.unrwa.org/-landing-page/en_EN"
                  className="resource-link text-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  UNRWA
                </a>
                <p className="text-sm text-muted mt-1">
                  The UN agency for Palestine refugees, providing food, shelter,
                  and essential services.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );

  if (isPrototypeMode) {
    return <PrototypeGallery />;
  }

  return (
    <TooltipProvider>
      <Meta pageId="home" />
      <a href="#main-content" className="skip-link">
        {t("common:skipLink")}
      </a>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fixed top-6 right-6 z-40 flex flex-col items-end gap-4">
          <div className="bg-slate-900/90 border border-white/20 text-white rounded-lg shadow-lg backdrop-blur px-4 py-2 focus-within:ring-2 focus-within:ring-white/60">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              className="bg-white/10 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              onClick={() => setArchiveExplorerOpen(true)}
            >
              {t("common:buttons.archiveExplorer")}
            </button>
            <span className="text-xs text-muted hidden md:block">
              {t("common:buttons.archiveExplorerHint")}
            </span>
          </div>
        </div>

        <nav
          className="flex flex-col md:flex-row md:items-center gap-4 py-6"
          aria-label={t("common:nav.label")}
        >
          <ul className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
            {sceneMeta.map((scene) => (
              <li key={scene.id}>
                <a
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-slate-900/60 text-text-secondary hover:text-text-primary hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  href={`#scene-${scene.id}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-accent"
                  />
                  {scene.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <RiverPath
          headerRef={headerRef}
          footerRef={footerRef}
          nodeRefs={nodeRefs}
          activeSceneIndex={activeSceneIndex}
          sceneCount={sceneCount}
        />

        <SceneOverlay
          sceneTitle={activeScene?.title ?? ""}
          description={activeScene?.description ?? ""}
          villages={activeSceneVillages}
          onSelectVillage={handleVillageOpen}
          isVisible={
            allowOverlay && Boolean(activeScene && activeSceneVillages.length > 0)
          }
        />

        <SceneAudioControls
          sceneId={activeScene?.id ?? "none"}
          sceneTitle={activeScene?.title ?? ""}
          audioAvailable={Boolean(activeScene?.audioSrc)}
          audioState={activeAudioState}
          onPlay={(sceneId) => {
            void playSceneAudio(sceneId);
          }}
          onPause={pauseSceneAudio}
          onToggleAutoPlay={handleAutoPlayToggle}
          autoPlay={autoPlay}
          volume={audioVolume}
          onVolumeChange={handleVolumeChange}
        />

        <header
          ref={headerRef}
          id="header"
          className="min-h-screen flex flex-col justify-center items-center text-center py-20 relative z-10"
        >
          <h1 className="font-serif text-6xl md:text-8xl text-white leading-tight tracking-tight">
            {t("app:title")}
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-text-secondary max-w-3xl">
            {t("app:description")}
          </p>
          {villagesStatusIsError ? (
            <div
              className="mt-4 text-sm text-red-200 bg-red-900/40 border border-red-800 rounded-lg px-4 py-2 max-w-md flex items-start gap-2"
              role="alert"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M10.073 3.51 1.824 18a2 2 0 0 0 1.754 3h16.844a2 2 0 0 0 1.754-3L13.176 3.51a2 2 0 0 0-3.103 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>{villagesStatusMessage}</span>
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted">
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 10h5v5H7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 3v3M17 3v3M5 7h14M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{villagesStatusMessage}</span>
              </span>
            </p>
          )}
          <VillageTicker villages={villages} />
          <div className="mt-12 text-muted animate-bounce" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </header>

        <main id="main-content" className="relative z-10">
          <ContentNode ref={rootsRef} alignment="left" id="scene-roots">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/ancient-olive-tree.jpg"
                  alt="An ancient, gnarled olive tree stands testament to deep roots and Palestinian steadfastness."
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t("common:nav.sections.roots")}
              </h2>

              <div className="space-y-4 text-text-secondary mb-8">
                <p>
                  <Trans
                    i18nKey="app:roots.p1"
                    components={{
                      balfour: (
                        <TooltipTrigger term="balfour">
                          Balfour Declaration
                        </TooltipTrigger>
                      ),
                      settler: (
                        <TooltipTrigger term="settler-colonialism">
                          settler movement
                        </TooltipTrigger>
                      ),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="app:roots.p2"
                    components={{
                      zionism: (
                        <TooltipTrigger term="zionism">Zionism</TooltipTrigger>
                      ),
                      nakba: (
                        <TooltipTrigger term="nakba">Nakba</TooltipTrigger>
                      ),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="app:roots.p3"
                    components={{
                      lifta: <>{renderVillageLink("Lifta")}</>,
                      deirYassin: <>{renderVillageLink("Deir Yassin")}</>,
                      alTantura: <>{renderVillageLink("al-Tantura")}</>,
                      lydda: <>{renderVillageLink("Lydda")}</>,
                    }}
                  />
                </p>
              </div>

              <div className="space-y-6 border-l-2 border-border pl-4 mb-8">
                <blockquote className="text-gray-300 italic">
                  <p>
                    “The surest way to eradicate a people's right to their land
                    is to deny their historical connection to it.”
                  </p>
                  <cite className="text-muted not-italic block mt-2">
                    — Rashid Khalidi, 'The Hundred Years' War on Palestine'
                  </cite>
                </blockquote>
                <AccordionItem title="Further Analysis" level="2xl">
                  <ul className="space-y-3">
                    <li>
                      <a href="/atlas" className="resource-link font-bold">
                        Explore the Atlas of Erasure →
                      </a>
                    </li>
                    <li>
                      {villagesStatusIsError ? (
                        <p className="text-sm text-muted mt-2 h-6">
                          {villagesStatusMessage}
                        </p>
                      ) : (
                        <VillageTicker villages={villages} />
                      )}
                    </li>
                    <li>
                      <a
                        href="https://101.visualizingpalestine.org/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Palestine 101: A Visual History
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.aljazeera.com/features/2017/5/23/the-nakba-did-not-start-or-end-in-1948"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        The Nakba of 1948: An Ongoing Catastrophe
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://decolonizepalestine.com/zionism/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Defining Zionism as a Settler-Colonial Project
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.un.org/unispal/history/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Key UN Resolutions and International Law
                      </a>
                    </li>
                  </ul>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>

          <ContentNode
            ref={resistanceRef}
            alignment="right"
            id="scene-resistance"
          >
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/resistance.jpg"
                  alt="A protestor holds a Palestinian flag and a megaphone, vocally symbolizing active resistance."
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t("common:nav.sections.resistance")}
              </h2>
              <p className="text-text-secondary mb-8">
                {t("app:resistance.p1")}
              </p>

              <div className="mb-8 border-t border-border pt-6 space-y-4">
                <AccordionItem title="Voices of Defiance" level="2xl">
                  <div className="space-y-3 text-text-secondary">
                    <p>
                      <strong>Ghassan Kanafani:</strong> A leading novelist,
                      journalist, and spokesman for the Popular Front for the
                      Liberation of Palestine (PFLP). His literary works were
                      inseparable from his political struggle, giving voice to
                      the experience of exile and the revolutionary imperative.
                      He was assassinated by Mossad in 1972.
                    </p>
                    <p>
                      <strong>Leila Khaled:</strong> A militant member of the
                      PFLP who became an international icon of armed resistance
                      following her role in two aircraft hijackings in 1969 and
                      1970. Her image became a powerful symbol of Palestinian
                      defiance and female revolutionary action.
                    </p>
                    <p>
                      <strong>Izz ad-Din al-Qassam:</strong> A Syrian-born
                      cleric and revolutionary leader whose armed struggle
                      against British and Zionist forces in the 1930s inspired a
                      generation. His martyrdom in 1935 was a key catalyst for
                      the 1936–1939 Arab revolt in Palestine, and his legacy
                      endures in the language of Palestinian resistance.
                    </p>
                  </div>
                </AccordionItem>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <AccordionItem title="Arenas of Struggle" level="2xl">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl text-gray-200">
                        Popular Uprisings & Sumud
                      </h4>
                      <p className="text-text-secondary mb-2">
                        From mass demonstrations to general strikes, the
                        Intifadas (uprisings) represent the power of collective
                        civil action. This is paired with{" "}
                        <TooltipTrigger term="sumud">Sumud</TooltipTrigger>{" "}
                        (steadfastness)—the daily act of remaining on one's land
                        and refusing to be erased.
                      </p>
                      <a
                        href="https://remix.aljazeera.com/aje/PalestineRemix/timeline_main.html"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Chronology of Intifadas
                      </a>
                      <a
                        href="https://www.palquest.org/en/highlight/22198/sumud-steadfastness"
                        className="resource-link ml-4"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Sumud: The Art of Steadfastness
                      </a>
                    </div>
                    <div>
                      <h4 className="text-xl text-gray-200">
                        Cultural & Literary Resistance
                      </h4>
                      <p className="text-text-secondary mb-2">
                        Art, poetry, music, and film are powerful tools for
                        preserving national identity and challenging colonial
                        narratives. Figures like Mahmoud Darwish used their
                        words to articulate the soul of the resistance, making
                        culture an undeniable front in the struggle.
                      </p>
                      <a
                        href="https://www.poetryfoundation.org/poets/mahmoud-darwish"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        The Poetry of Mahmoud Darwish
                      </a>
                    </div>
                    <div>
                      <h4 className="text-xl text-gray-200">
                        Global Solidarity & BDS
                      </h4>
                      <p className="text-text-secondary mb-2">
                        The Boycott, Divestment, Sanctions (BDS) movement is a
                        Palestinian-led global campaign. It applies non-violent
                        economic and cultural pressure on Israel to comply with
                        international law and end its oppression of
                        Palestinians.
                      </p>
                      <a
                        href="https://bdsmovement.net/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        The Global BDS Movement
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>

          <ContentNode ref={cultureRef} alignment="left" id="scene-culture">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/palestinian-culture.jpg"
                  alt="A woman embroiders fabric with traditional Palestinian Tatreez, a core symbol of cultural identity."
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t("common:nav.sections.culture")}
              </h2>
              <p className="text-text-secondary mb-8">
                <Trans
                  i18nKey="app:culture.p1"
                  components={{
                    sumud: <TooltipTrigger term="sumud">Sumud</TooltipTrigger>,
                  }}
                />
              </p>

              <div className="space-y-4 border-t border-border pt-6">
                <AccordionItem title="Cuisine as Identity">
                  <p className="text-text-secondary my-2">
                    The kitchen is a site of resistance. Dishes like{" "}
                    <em>Maqluba</em> (the “upside-down” pot of rice, meat, and
                    vegetables) are more than food; they are communal rituals
                    that tell a story of land and family. Sharing these meals
                    asserts a national identity that Israel actively attempts to
                    appropriate and rebrand as its own.
                  </p>
                  <a
                    href="https://sustainablefoodtrust.org/news-views/a-taste-of-palestine-cultivating-resistance/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    A Taste of Palestine
                  </a>
                </AccordionItem>
                <AccordionItem title="Tatreez: The Fabric of a Nation">
                  <p className="text-text-secondary my-2">
                    Palestinian embroidery, or <em>Tatreez</em>, is a language
                    in thread. The intricate geometric patterns are not merely
                    decorative; they are a visual dialect signifying regional
                    identity, marital status, and ancestral heritage. A dress
                    from Ramallah tells a different story from one from Gaza.
                    This art form literally stitches the map of a fragmented
                    homeland onto the bodies of its people, defying erasure.
                  </p>
                  <a
                    href="https://www.palestineinamerica.com/blog/untangledtatreez"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Untangling Tatreez
                  </a>
                </AccordionItem>
                <AccordionItem title="Cinema, Music & Dabke">
                  <p className="text-text-secondary my-2">
                    From the politically charged films that document the
                    struggle to the powerful rhythms of the <em>Dabke</em>{" "}
                    dance, these art forms carry the spirit of the movement. The{" "}
                    <em>Dabke's</em> stomping feet symbolize a connection to the
                    land, while Palestinian cinema gives the people control over
                    their own narrative, challenging the dehumanizing portrayals
                    in Western media.
                  </p>
                  <a
                    href="https://arabfilminstitute.org/palestinian-voices/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Palestinian Cinema
                  </a>
                  <a
                    href="https://shado-mag.com/articles/do/dabke-resistance-through-movement/"
                    className="resource-link ml-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    The Rhythms of Dabke
                  </a>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>

          <ContentNode ref={actionRef} alignment="right" id="scene-action">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/collective-action.jpg"
                  alt="A crowd of people marching in a street protest, embodying the power of collective action and solidarity."
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t("common:nav.sections.action")}
              </h2>
              <p className="text-text-secondary mb-8">
                {t("app:action.p1")}
              </p>

              <div className="space-y-4 border-t border-border pt-6">
                <AccordionItem title="Donate: Vetted Aid & Solidarity Funds">
                  <p className="text-text-secondary my-2">
                    Amidst blockade and siege, direct financial support provides
                    critical humanitarian relief and resources for
                    steadfastness. This is a direct counter-measure to the
                    strategy of immiseration.
                  </p>
                  <button
                    type="button"
                    className="resource-link"
                    onClick={() => setDonateOpen(true)}
                  >
                    Access Solidarity Funds
                  </button>
                </AccordionItem>
                <AccordionItem title="Support Palestinian Businesses">
                  <p className="text-text-secondary my-2">
                    Economic solidarity is a powerful tool. Buying from
                    Palestinian artisans and fair-trade initiatives directly
                    supports families and resists the economic strangulation of
                    the occupation.
                  </p>
                  <a
                    href="https://www.palestineportal.org/action-advocacy/support-palestine-fair-trade/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy Palestinian
                  </a>
                </AccordionItem>
                <AccordionItem title="Educate & Advocate">
                  <p className="text-text-secondary my-2">
                    The battle is also for hearts and minds. Use these toolkits
                    to effectively challenge disinformation within your own
                    circles and articulate the case for justice to public
                    representatives.
                  </p>
                  <button
                    type="button"
                    className="resource-link"
                    onClick={() => setToolkitOpen(true)}
                  >
                    Access Toolkits
                  </button>
                </AccordionItem>
              </div>

              <div className="mt-8 pt-6 border-t border-border space-y-4">
                <AccordionItem
                  title="Find Your Frontline: Build Local Power"
                  level="2xl"
                >
                  <div className="space-y-3 text-text-secondary">
                    <p>
                      Power is built in local struggles. Join or organize
                      teach-ins, pressure campaigns, and rapid-response networks
                      that can mobilize in moments of crisis.
                    </p>
                    <p>
                      Campus and community organizations have been at the
                      forefront of shifting public consciousness. Coordinate
                      with Palestinian-led groups to ensure efforts align with
                      articulated needs.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="https://www.jewishvoiceforpeace.org/local/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Find a JVP Chapter
                      </a>
                      <a
                        href="https://www.nationalsjp.org/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Connect with SJP
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              </div>
              <ExternalUpdatesPanel
                payload={externalUpdates}
                error={externalUpdatesErrorMessage}
                isLoading={isExternalUpdatesLoading}
                onRetry={() => {
                  void loadExternalUpdates();
                }}
              />
            </div>
          </ContentNode>
        </main>

        <footer
          ref={footerRef}
          id="footer"
          className="text-center py-10 border-t border-border relative z-10"
        >
          <p className="text-muted">
            From The River To The Sea, Palestine Will Be Free.
          </p>
          <p className="text-xs text-text-secondary mt-2">
            fromtheriver.org - A project of solidarity.
          </p>
        </footer>

        {renderModals()}
      </div>
    </TooltipProvider>
  );
};

export default App;
