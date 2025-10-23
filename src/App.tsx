import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import RiverPath from './components/RiverPath';
import ContentNode from './components/ContentNode';
import AccordionItem from './components/AccordionItem';
import VillageTicker from './components/VillageTicker';
import CodexModal from './components/CodexModal';
import Modal from './components/Modal';
import { TooltipProvider, TooltipTrigger } from './components/TooltipProvider';
import { Village } from './data/types';
import { VillageLink } from './components/VillageLink';
import SceneOverlay from './components/SceneOverlay';
import SceneAudioControls from './components/SceneAudioControls';
import { useRiverScenes, UseRiverScenesConfig } from './js/riverScenes';
import { generateAmbientToneDataUri } from './js/ambientTone';
import PrototypeGallery from './prototypes/PrototypeGallery';
import LanguageSwitcher from './components/LanguageSwitcher';

type SceneId = 'roots' | 'resistance' | 'culture' | 'action';

interface SceneMetadata {
  id: SceneId;
  title: string;
  description: string;
  ref: React.MutableRefObject<HTMLElement | null>;
  audioSrc: string;
  order: number;
  focusVillages: string[];
}

const App: React.FC = () => {
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const rootsRef = useRef<HTMLElement | null>(null);
  const resistanceRef = useRef<HTMLElement | null>(null);
  const cultureRef = useRef<HTMLElement | null>(null);
  const actionRef = useRef<HTMLElement | null>(null);

  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = i18n.dir(language);
  }, [i18n, language]);

  const [villages, setVillages] = useState<Village[]>([]);
  const [villagesErrorKey, setVillagesErrorKey] = useState<string | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [isToolkitOpen, setToolkitOpen] = useState(false);
  const [isDonateOpen, setDonateOpen] = useState(false);

  const isPrototypeMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('prototype') === 'gallery';

  useEffect(() => {
    if (isPrototypeMode) {
      return;
    }

    let isMounted = true;
    fetch('/villages.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Village[]) => {
        if (isMounted) {
          setVillages(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setVillagesErrorKey('errors.villages');
          console.error('Failed to load village data', error);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isPrototypeMode]);

  const nodeRefs = useMemo(
    () => [rootsRef, resistanceRef, cultureRef, actionRef],
    []
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
    []
  );

  const sceneMeta = useMemo<SceneMetadata[]>(
    () => [
      {
        id: 'roots',
        title: t('scenes.roots.title'),
        description: t('scenes.roots.overlayDescription'),
        ref: rootsRef,
        audioSrc: toneSources.roots,
        order: 0,
        focusVillages: ['Lifta', 'Deir Yassin', 'al-Tantura'],
      },
      {
        id: 'resistance',
        title: t('scenes.resistance.title'),
        description: t('scenes.resistance.overlayDescription'),
        ref: resistanceRef,
        audioSrc: toneSources.resistance,
        order: 1,
        focusVillages: ['Haifa', 'Acre', 'Safad'],
      },
      {
        id: 'culture',
        title: t('scenes.culture.title'),
        description: t('scenes.culture.overlayDescription'),
        ref: cultureRef,
        audioSrc: toneSources.culture,
        order: 2,
        focusVillages: ['Jaffa', 'Beisan'],
      },
      {
        id: 'action',
        title: t('scenes.action.title'),
        description: t('scenes.action.overlayDescription'),
        ref: actionRef,
        audioSrc: toneSources.action,
        order: 3,
        focusVillages: ['Lydda', 'al-Ramla'],
      },
    ],
    [actionRef, cultureRef, resistanceRef, rootsRef, toneSources, t]
  );

  const sceneConfigs = useMemo<UseRiverScenesConfig[]>(
    () =>
      sceneMeta.map(({ id, ref, audioSrc, order }) => ({
        id,
        ref,
        audioSrc,
        order,
      })),
    [sceneMeta]
  );

  const sceneObserverOptions = useMemo<IntersectionObserverInit>(
    () => ({
      threshold: 0.4,
      rootMargin: '-15% 0px -25% 0px',
    }),
    []
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
    [sceneMeta, activeSceneId]
  );

  const sceneCount = sceneConfigs.length;

  const activeSceneIndex = useMemo(
    () => (activeScene ? activeScene.order : -1),
    [activeScene]
  );

  const activeSceneVillages = useMemo(() => {
    if (!activeScene) {
      return [] as Village[];
    }

    return activeScene.focusVillages
      .map((targetName) =>
        villages.find(
          (village) => village.name.toLowerCase() === targetName.toLowerCase()
        )
      )
      .filter((village): village is Village => Boolean(village));
  }, [activeScene, villages]);

  const activeAudioState = useMemo(
    () =>
      activeScene
        ? getSceneAudioState(activeScene.id)
        : { isPlaying: false, volume: audioVolume },
    [activeScene, getSceneAudioState, audioVolume]
  );

  useEffect(() => {
    sceneMeta.forEach((scene) => {
      const element = scene.ref.current;
      if (!element) return;
      element.dataset.sceneActive = activeSceneId === scene.id ? 'true' : 'false';
    });
  }, [sceneMeta, activeSceneId]);

  const handleVillageSelect = useCallback(
    (name: string) => {
      const village = villages.find(
        (entry) => entry.name.toLowerCase() === name.toLowerCase()
      );
      if (village) {
        setSelectedVillage(village);
      }
    },
    [villages]
  );

  const closeCodex = useCallback(() => setSelectedVillage(null), []);

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
  }, [autoPlay, toggleAutoPlay, activeSceneId, playSceneAudio, pauseSceneAudio]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolume(value);
    },
    [setVolume]
  );

  const navItems = useMemo(
    () => [
      { id: 'roots', label: t('app.nav.roots') },
      { id: 'resistance', label: t('app.nav.resistance') },
      { id: 'culture', label: t('app.nav.culture') },
      { id: 'action', label: t('app.nav.action') },
    ],
    [t]
  );

  if (isPrototypeMode) {
    return <PrototypeGallery />;
  }

  return (
    <TooltipProvider>
      <a className="skip-link" href="#main-content">
        {t('app.skipToMain')}
      </a>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="sticky top-4 z-40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/75 backdrop-blur-md border border-border/60 rounded-xl px-4 py-3 shadow-lg"
          aria-label={t('app.navLabel')}
        >
          <ul className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            {navItems.map((item) => {
              const isCurrent = activeScene?.id === item.id;
              return (
                <li key={item.id}>
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-white/80 hover:text-white hover:border-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    href={`#${item.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    <span aria-hidden="true">•</span>
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <LanguageSwitcher />
        </nav>

        <RiverPath
          headerRef={headerRef}
          footerRef={footerRef}
          nodeRefs={nodeRefs}
          activeSceneIndex={activeSceneIndex}
          sceneCount={sceneCount}
        />

        <SceneOverlay
          sceneTitle={activeScene?.title ?? ''}
          description={activeScene?.description ?? ''}
          villages={activeSceneVillages}
          onSelectVillage={(village) => setSelectedVillage(village)}
          isVisible={Boolean(activeScene && activeSceneVillages.length > 0)}
        />

        <SceneAudioControls
          sceneId={activeScene?.id ?? 'none'}
          sceneTitle={activeScene?.title ?? ''}
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
            {t('app.title')}
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-text-secondary max-w-3xl">
            {t('app.tagline')}
          </p>
          <div className="mt-12 text-text-secondary flex flex-col items-center gap-2" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm uppercase tracking-[0.3em]">{t('app.nav.roots')}</span>
          </div>
        </header>

        <main id="main-content" role="main" tabIndex={-1} className="relative z-10">
          <ContentNode ref={rootsRef} alignment="left" id="roots">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/ancient-olive-tree.jpg"
                  alt={t('scenes.roots.imageAlt')}
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">{t('scenes.roots.title')}</h2>

              <div className="space-y-4 text-text-secondary mb-8">
                <p>
                  <Trans
                    i18nKey="scenes.roots.paragraphs.0"
                    components={{
                      balfour: <TooltipTrigger term="balfour" />,
                      settler: <TooltipTrigger term="settler-colonialism" />,
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="scenes.roots.paragraphs.1"
                    components={{
                      zionism: <TooltipTrigger term="zionism" />,
                      nakba: <TooltipTrigger term="nakba" />,
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="scenes.roots.paragraphs.2"
                    components={{
                      lifta: (
                        <VillageLink name="Lifta" onSelect={handleVillageSelect} />
                      ),
                      deirYassin: (
                        <VillageLink
                          name="Deir Yassin"
                          onSelect={handleVillageSelect}
                        />
                      ),
                      alTantura: (
                        <VillageLink
                          name="al-Tantura"
                          onSelect={handleVillageSelect}
                        />
                      ),
                      lydda: (
                        <VillageLink name="Lydda" onSelect={handleVillageSelect} />
                      ),
                    }}
                  />
                </p>
              </div>

              <div className="space-y-6 border-l-2 border-border pl-4 mb-8">
                <blockquote className="text-text-secondary-strong italic">
                  <p>{t('scenes.roots.quote.text')}</p>
                  <cite className="text-text-tertiary not-italic block mt-2">
                    {t('scenes.roots.quote.attribution')}
                  </cite>
                </blockquote>
                <AccordionItem title={t('scenes.roots.analysis.title')} level="2xl">
                  <ul className="space-y-3">
                    <li>
                      <a href="/atlas.html" className="resource-link font-bold">
                        {t('scenes.roots.analysis.atlas')}
                      </a>
                    </li>
                    <li>
                      {villagesErrorKey ? (
                        <p className="text-sm text-text-tertiary mt-2 h-6">
                          {t(villagesErrorKey)}
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
                        {t('scenes.roots.analysis.palestine101')}
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.aljazeera.com/features/2017/5/23/the-nakba-did-not-start-or-end-in-1948"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('scenes.roots.analysis.nakba')}
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://decolonizepalestine.com/zionism/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('scenes.roots.analysis.zionism')}
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.un.org/unispal/history/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('scenes.roots.analysis.un')}
                      </a>
                    </li>
                  </ul>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>

          <ContentNode ref={resistanceRef} alignment="right" id="resistance">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/intifada-women.jpg"
                  alt={t('scenes.resistance.imageAlt')}
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t('scenes.resistance.title')}
              </h2>
              <div className="space-y-4 text-text-secondary">
                <p>{t('scenes.resistance.paragraphs.0')}</p>
                <p>{t('scenes.resistance.paragraphs.1')}</p>
                <p>{t('scenes.resistance.paragraphs.2')}</p>
              </div>
            </div>
          </ContentNode>

          <ContentNode ref={cultureRef} alignment="left" id="culture">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/palestinian-culture.jpg"
                  alt={t('scenes.culture.imageAlt')}
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t('scenes.culture.title')}
              </h2>
              <p className="text-text-secondary mb-6">
                {t('scenes.culture.intro')}
              </p>
              <div className="space-y-4 text-text-secondary">
                <p>
                  <Trans
                    i18nKey="scenes.culture.paragraphs.0"
                    components={{ sumud: <TooltipTrigger term="sumud" /> }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="scenes.culture.paragraphs.1"
                    components={{
                      maqluba: <span className="italic" />,
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="scenes.culture.paragraphs.2"
                    components={{
                      tatreez: <span className="italic" />,
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="scenes.culture.paragraphs.3"
                    components={{
                      dabke: <span className="italic" />,
                    }}
                  />
                </p>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <AccordionItem title={t('scenes.culture.accordion.cuisine.title')}>
                  <p className="text-text-secondary my-2">
                    <Trans
                      i18nKey="scenes.culture.paragraphs.1"
                      components={{
                        maqluba: <span className="italic" />,
                      }}
                    />
                  </p>
                  <a
                    href="https://sustainablefoodtrust.org/news-views/a-taste-of-palestine-cultivating-resistance/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('scenes.culture.accordion.cuisine.link')}
                  </a>
                </AccordionItem>
                <AccordionItem title={t('scenes.culture.accordion.tatreez.title')}>
                  <p className="text-text-secondary my-2">
                    <Trans
                      i18nKey="scenes.culture.paragraphs.2"
                      components={{
                        tatreez: <span className="italic" />,
                      }}
                    />
                  </p>
                  <a
                    href="https://www.palestineinamerica.com/blog/untangledtatreez"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('scenes.culture.accordion.tatreez.link')}
                  </a>
                </AccordionItem>
                <AccordionItem title={t('scenes.culture.accordion.arts.title')}>
                  <p className="text-text-secondary my-2">
                    <Trans
                      i18nKey="scenes.culture.paragraphs.3"
                      components={{
                        dabke: <span className="italic" />,
                      }}
                    />
                  </p>
                  <a
                    href="https://arabfilminstitute.org/palestinian-voices/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('scenes.culture.accordion.arts.film')}
                  </a>
                  <a
                    href="https://shado-mag.com/articles/do/dabke-resistance-through-movement/"
                    className="resource-link ml-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('scenes.culture.accordion.arts.dance')}
                  </a>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>

          <ContentNode ref={actionRef} alignment="right" id="action">
            <div className="node-card w-full md:w-1/2">
              <div className="node-image-container">
                <img
                  src="/images/collective-action.jpg"
                  alt={t('scenes.action.imageAlt')}
                />
              </div>
              <h2 className="font-serif text-4xl text-white mb-4">
                {t('scenes.action.title')}
              </h2>
              <p className="text-text-secondary mb-8">
                {t('scenes.action.intro')}
              </p>

              <div className="space-y-4 border-t border-border pt-6">
                <AccordionItem title={t('scenes.action.accordion.donate.title')}>
                  <p className="text-text-secondary my-2">
                    {t('scenes.action.accordion.donate.description')}
                  </p>
                  <button
                    type="button"
                    className="resource-link"
                    onClick={() => setDonateOpen(true)}
                  >
                    {t('scenes.action.accordion.donate.button')}
                  </button>
                </AccordionItem>
                <AccordionItem title={t('scenes.action.accordion.business.title')}>
                  <p className="text-text-secondary my-2">
                    {t('scenes.action.accordion.business.description')}
                  </p>
                  <a
                    href="https://www.palestineportal.org/action-advocacy/support-palestine-fair-trade/"
                    className="resource-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('scenes.action.accordion.business.link')}
                  </a>
                </AccordionItem>
                <AccordionItem title={t('scenes.action.accordion.educate.title')}>
                  <p className="text-text-secondary my-2">
                    {t('scenes.action.accordion.educate.description')}
                  </p>
                  <button
                    type="button"
                    className="resource-link"
                    data-cy="open-toolkit-modal"
                    onClick={() => setToolkitOpen(true)}
                  >
                    {t('scenes.action.accordion.educate.button')}
                  </button>
                </AccordionItem>
              </div>

              <div className="mt-8 pt-6 border-t border-border space-y-4">
                <AccordionItem
                  title={t('scenes.action.accordion.organize.title')}
                  level="2xl"
                >
                  <div className="space-y-3 text-text-secondary">
                    <p>{t('scenes.action.accordion.organize.body.0')}</p>
                    <p>{t('scenes.action.accordion.organize.body.1')}</p>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="https://www.jewishvoiceforpeace.org/local/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('scenes.action.accordion.organize.links.jvp')}
                      </a>
                      <a
                        href="https://www.nationalsjp.org/"
                        className="resource-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('scenes.action.accordion.organize.links.sjp')}
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              </div>
            </div>
          </ContentNode>
        </main>

        <footer
          ref={footerRef}
          id="footer"
          className="text-center py-10 border-t border-border relative z-10"
        >
          <p className="text-text-tertiary">{t('app.footer.solidarity')}</p>
          <p className="text-xs text-text-secondary mt-2">
            {t('app.footer.credit')}
          </p>
        </footer>

        <CodexModal village={selectedVillage} onClose={closeCodex} />

        <Modal
          isOpen={isToolkitOpen}
          onClose={() => setToolkitOpen(false)}
          title={t('modals.toolkit.title')}
        >
          <p className="text-text-secondary mb-6">{t('modals.toolkit.intro')}</p>
          <ul className="space-y-4">
            <li>
              <a
                href="https://palianswers.com/"
                className="resource-link text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('modals.toolkit.links.paliAnswers')}
              </a>
            </li>
            <li>
              <a
                href="https://decolonizepalestine.com/myths/"
                className="resource-link text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('modals.toolkit.links.decolonize')}
              </a>
            </li>
          </ul>
        </Modal>

        <Modal
          isOpen={isDonateOpen}
          onClose={() => setDonateOpen(false)}
          title={t('modals.donate.title')}
        >
          <p className="text-text-secondary mb-8">{t('modals.donate.intro')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h4 className="font-serif text-xl text-white mb-3 border-b border-border pb-2">
                {t('modals.donate.groups.direct')}
              </h4>
              <ul className="space-y-4">
                {(['oliveBranch', 'fundsForGaza', 'eSims', 'mutualAid'] as const).map((entry) => (
                  <li key={entry}>
                    <a
                      href={
                        {
                          oliveBranch:
                            'https://docs.google.com/spreadsheets/d/1vtMLLOzuc6GpkFySyVtKQOY2j-Vvg0UsChMCFst_WLA/htmlview',
                          fundsForGaza: 'https://linktr.ee/fundsforgaza',
                          eSims:
                            'https://www.instagram.com/p/C03zzwUvClA/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
                          mutualAid: 'https://www.bonfire.com/arkansas-fundraiser-for-palestine/',
                        }[entry]
                      }
                      className="resource-link text-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t(`modals.donate.entries.${entry}.name`)}
                    </a>
                    <p className="text-sm text-text-tertiary mt-1">
                      {t(`modals.donate.entries.${entry}.description`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-xl text-white mb-3 border-b border-border pb-2">
                {t('modals.donate.groups.institutional')}
              </h4>
              <ul className="space-y-4">
                {(['pcrf', 'map', 'msf', 'unrwa'] as const).map((entry) => (
                  <li key={entry}>
                    <a
                      href={
                        {
                          pcrf: 'https://www.pcrf.net/',
                          map: 'https://www.map.org.uk/',
                          msf: 'https://www.doctorswithoutborders.org/',
                          unrwa: 'https://donate.unrwa.org/-landing-page/en_EN',
                        }[entry]
                      }
                      className="resource-link text-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t(`modals.donate.entries.${entry}.name`)}
                    </a>
                    <p className="text-sm text-text-tertiary mt-1">
                      {t(`modals.donate.entries.${entry}.description`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </TooltipProvider>
  );
};

export default App;
