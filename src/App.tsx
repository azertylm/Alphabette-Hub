import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound, LayoutGrid, Lightbulb } from 'lucide-react';
import { DoubleBarreHeader } from './components/DoubleBarreHeader';
import { PassportPanel } from './components/PassportPanel';
import { IdeasPanel } from './components/IdeasPanel';
import { AppsPanel } from './components/AppsPanel';
import { DEFAULT_IDEAS, DEFAULT_PASSPORT, STORAGE_KEYS } from './data/ecosystem';
import type {
  AiEngineMode,
  HubTabId,
  PassportSettings,
  ProductIdea,
  ToastItem,
} from './types';
import {
  buildPassportSyncUrl,
  decodeBase64Unicode,
  sanitizePassport,
  toggleIdeaVote,
} from './utils/hubLogic';

function readInitialPassport(): {
  passport: PassportSettings;
  syncedFromUrl: boolean;
  urlError: boolean;
} {
  if (typeof window === 'undefined') {
    return { passport: { ...DEFAULT_PASSPORT }, syncedFromUrl: false, urlError: false };
  }

  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('passport');
  if (encoded) {
    try {
      const decoded = decodeBase64Unicode(encoded);
      const sanitized = sanitizePassport(decoded);
      localStorage.setItem(STORAGE_KEYS.PASSPORT, JSON.stringify(sanitized));
      window.history.replaceState({}, document.title, window.location.pathname);
      return { passport: sanitized, syncedFromUrl: true, urlError: false };
    } catch {
      return { passport: { ...DEFAULT_PASSPORT }, syncedFromUrl: false, urlError: true };
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PASSPORT);
    if (saved) {
      return {
        passport: sanitizePassport(JSON.parse(saved)),
        syncedFromUrl: false,
        urlError: false,
      };
    }
  } catch {
    // Fallback to default
  }

  return { passport: { ...DEFAULT_PASSPORT }, syncedFromUrl: false, urlError: false };
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const initialPassportState = useMemo(() => readInitialPassport(), []);
  const [passport, setPassport] = useState<PassportSettings>(initialPassportState.passport);
  const [activeTab, setActiveTab] = useState<HubTabId>('passport');
  const [ideas, setIdeas] = useState<ProductIdea[]>(() =>
    readStoredJson<ProductIdea[]>(STORAGE_KEYS.IDEAS, DEFAULT_IDEAS)
  );
  const [userVotes, setUserVotes] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.VOTES, [])
  );
  const [aiMode, setAiMode] = useState<AiEngineMode>(() => {
    const stored = readStoredJson<string>(STORAGE_KEYS.AI_MODE, 'local');
    return stored === 'gemini' ? 'gemini' : 'local';
  });

  // Double Barre local states
  const [favoriteAppIds, setFavoriteAppIds] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.FAVORITE_APPS, ['infoperso'])
  );
  const [isPinned, setIsPinned] = useState<boolean>(() =>
    readStoredJson<boolean>(STORAGE_KEYS.PINNED_HUB, false)
  );
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(() =>
    readStoredJson<boolean>(STORAGE_KEYS.SIMPLE_MODE, false)
  );
  const [language, setLanguage] = useState<string>(() =>
    readStoredJson<string>(STORAGE_KEYS.LANGUAGE, 'FR')
  );

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [guideY, setGuideY] = useState<number>(220);

  const mainRef = useRef<HTMLElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const passportRef = useRef(passport);
  passportRef.current = passport;

  // Charger les voix françaises disponibles dans le navigateur
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const french = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
      setAvailableVoices(french.length > 0 ? french : voices.slice(0, 12));
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  // Suivi du pointeur pour la Règle de lecture
  useEffect(() => {
    if (!passport.readingGuide) return;
    const onMove = (e: PointerEvent) => {
      setGuideY(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [passport.readingGuide]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string, silentIfUnsupported = false) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (!silentIfUnsupported) {
          setToasts([
            {
              id: `toast-${Date.now()}`,
              message: "La synthèse vocale n'est pas supportée par ce navigateur.",
              type: 'error',
            },
          ]);
        }
        return;
      }
      stopSpeaking();
      const current = passportRef.current;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = current.speechRate || 1;
      utterance.pitch = current.speechPitch || 1;

      if (current.voiceName) {
        const match = window.speechSynthesis
          .getVoices()
          .find((v) => v.name === current.voiceName);
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking]
  );

  const pushToast = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToasts([{ id, message, type }]);
      toastTimerRef.current = window.setTimeout(() => {
        setToasts([]);
        toastTimerRef.current = null;
      }, 3000);

      if (passportRef.current.speakToasts) {
        speakText(message, true);
      }
    },
    [speakText]
  );

  // Annonce de synchronisation URL au montage
  useEffect(() => {
    if (initialPassportState.syncedFromUrl) {
      pushToast('Passeport Alphabette synchronisé depuis votre lien !', 'success');
    } else if (initialPassportState.urlError) {
      pushToast('Le lien Passeport détecté est invalide. Réglages locaux conservés.', 'error');
    }
  }, [initialPassportState, pushToast]);

  // Synchronisation complète des attributs DOM sur <html> + localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', passport.theme);
    root.setAttribute('data-accent', passport.accentColor);
    root.setAttribute('data-color-blind', passport.colorBlindFilter);
    root.setAttribute('data-font-size', passport.fontSize);
    root.setAttribute('data-font-family', passport.fontFamily);
    root.setAttribute('data-line-height', passport.lineHeight);
    root.setAttribute('data-letter-spacing', passport.letterSpacing);
    root.setAttribute('data-reading-width', passport.readingWidth);
    root.setAttribute('data-button-size', passport.buttonSize);
    root.setAttribute('data-focus-style', passport.focusStyle);
    root.setAttribute('data-reduced-motion', passport.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-underline-links', passport.underlineLinks ? 'true' : 'false');
    root.setAttribute('data-large-cursor', passport.largeCursor ? 'true' : 'false');

    if (passport.theme === 'onyx' || passport.theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEYS.PASSPORT, JSON.stringify(passport));
    } catch {
      // Ignore quota errors
    }
  }, [passport]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(userVotes));
    } catch {
      // Ignore
    }
  }, [ideas, userVotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_MODE, JSON.stringify(aiMode));
    } catch {
      // Ignore
    }
  }, [aiMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITE_APPS, JSON.stringify(favoriteAppIds));
      localStorage.setItem(STORAGE_KEYS.PINNED_HUB, JSON.stringify(isPinned));
      localStorage.setItem(STORAGE_KEYS.SIMPLE_MODE, JSON.stringify(isSimpleMode));
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify(language));
    } catch {
      // Ignore
    }
  }, [favoriteAppIds, isPinned, isSimpleMode, language]);

  const handleToggleSpeakPage = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const contentText = mainRef.current?.innerText?.replace(/\s+/g, ' ').trim();
    if (contentText) {
      speakText(contentText.slice(0, 1400));
    }
  }, [isSpeaking, speakText, stopSpeaking]);

  const handleCopyText = useCallback(
    async (text: string, successMessage: string) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          pushToast(successMessage, 'success');
          return;
        }
      } catch {
        // Fallback below
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) {
          pushToast(successMessage, 'success');
        } else {
          pushToast('Impossible de copier automatiquement.', 'error');
        }
      } catch {
        pushToast('Copie non supportée sur ce navigateur.', 'error');
      }
    },
    [pushToast]
  );

  const handleUpdatePassport = useCallback((patch: Partial<PassportSettings>) => {
    setPassport((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleReplacePassport = useCallback(
    (next: PassportSettings, message: string) => {
      setPassport(next);
      pushToast(message, 'success');
    },
    [pushToast]
  );

  const handleResetPassport = useCallback(() => {
    setPassport({ ...DEFAULT_PASSPORT });
    setIsSimpleMode(false);
    pushToast('Passeport réinitialisé aux valeurs par défaut.', 'info');
  }, [pushToast]);

  const handleToggleBig = useCallback(() => {
    setPassport((prev) => ({
      ...prev,
      fontSize: prev.fontSize === 'normal' ? 'lg' : 'normal',
    }));
  }, []);

  const handleToggleDayNight = useCallback(() => {
    setPassport((prev) => ({
      ...prev,
      theme: prev.theme === 'onyx' || prev.theme === 'high-contrast' ? 'light' : 'onyx',
    }));
  }, []);

  const handleTogglePin = useCallback(() => {
    setIsPinned((prev) => {
      const next = !prev;
      pushToast(
        next ? 'Alphabette Hub épinglée dans vos favoris !' : 'Épinglage retiré.',
        'info'
      );
      return next;
    });
  }, [pushToast]);

  const handleToggleSimpleMode = useCallback(() => {
    setIsSimpleMode((prev) => {
      const next = !prev;
      if (next) {
        setPassport((p) => ({
          ...p,
          fontSize: p.fontSize === 'normal' ? 'lg' : p.fontSize,
          reducedMotion: true,
        }));
        pushToast('Mode simple activé : lecture agrandie et confort renforcé.', 'success');
      } else {
        pushToast('Mode simple désactivé.', 'info');
      }
      return next;
    });
  }, [pushToast]);

  const handleToggleFavoriteApp = useCallback((appId: string) => {
    setFavoriteAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const handleSwitchTab = useCallback(
    (tab: HubTabId) => {
      setActiveTab(tab);
      if (passport.autoRead) {
        const announcements: Record<HubTabId, string> = {
          passport:
            'Onglet Mon Passeport Alphabette. Réglez votre confort visuel, typographique, moteur et vocal.',
          ideas:
            'Onglet La Boîte à Idées Vivante. Dictez une idée ou votez pour les projets de la communauté.',
          apps:
            'Onglet Les Applis Alphabette. Choisissez une application adaptée à votre passeport.',
        };
        speakText(announcements[tab]);
      }
    },
    [passport.autoRead, speakText]
  );

  const handlePublishIdea = useCallback(
    (draft: { name: string; target: string; problem: string; features: string[] }) => {
      const newId = `idea-${Date.now()}`;
      const newIdea: ProductIdea = {
        id: newId,
        name: draft.name,
        target: draft.target,
        problem: draft.problem,
        features: draft.features,
        votes: 1,
        createdAt: Date.now(),
      };
      setIdeas((prev) => [newIdea, ...prev]);
      setUserVotes((prev) => [...prev, newId]);
      pushToast(`"${draft.name}" a été publiée dans la Boîte à Idées !`, 'success');
    },
    [pushToast]
  );

  const handleToggleVote = useCallback(
    (ideaId: string) => {
      const result = toggleIdeaVote(ideas, userVotes, ideaId);
      setIdeas(result.ideas);
      setUserVotes(result.userVotes);
      if (result.targetName) {
        pushToast(
          result.added
            ? `Vote enregistré pour "${result.targetName}" !`
            : `Vote retiré pour "${result.targetName}".`,
          result.added ? 'success' : 'info'
        );
      }
    },
    [ideas, pushToast, userVotes]
  );

  const syncUrl = useMemo(() => {
    const base =
      typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
        ? window.location.origin + window.location.pathname
        : 'https://alphabette.eu/hub';
    return buildPassportSyncUrl(passport, base);
  }, [passport]);

  const isBigMode = passport.fontSize !== 'normal';
  const isDarkVisual = passport.theme === 'onyx' || passport.theme === 'high-contrast';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Filtres SVG daltonisme (invisibles, zéro espace) */}
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          <filter id="cb-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0,0.242,0.758,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="cb-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="cb-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0"
            />
          </filter>
        </defs>
      </svg>

      {/* Filtre lumière bleue (overlay ambré non-interactif) */}
      {passport.warmth > 0 && (
        <div
          className="no-print fixed inset-0 z-50 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundColor:
              passport.warmth === 1
                ? 'rgba(245, 158, 11, 0.09)'
                : 'rgba(217, 119, 6, 0.18)',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* Règle de lecture horizontale (Guide de ligne) */}
      {passport.readingGuide && (
        <div
          className="no-print fixed left-0 right-0 z-30 pointer-events-none"
          aria-hidden="true"
          data-testid="reading-guide-bar"
          style={{
            top: `${Math.max(108, guideY - 22)}px`,
            height: '44px',
            backgroundColor: isDarkVisual
              ? 'rgba(250, 204, 21, 0.14)'
              : 'rgba(0, 68, 158, 0.09)',
            borderTop: isDarkVisual
              ? '2px solid rgba(250, 204, 21, 0.55)'
              : '2px solid rgba(0, 68, 158, 0.35)',
            borderBottom: isDarkVisual
              ? '2px solid rgba(250, 204, 21, 0.55)'
              : '2px solid rgba(0, 68, 158, 0.35)',
          }}
        />
      )}

      {/* Lien d'évitement pour navigation clavier et lecteurs d'écran */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Double Barre Alphabette obligatoire (taille fixe en px, isolée du mode BIG) */}
      <DoubleBarreHeader
        passport={passport}
        isBigMode={isBigMode}
        isDarkVisual={isDarkVisual}
        isSpeaking={isSpeaking}
        isPinned={isPinned}
        isSimpleMode={isSimpleMode}
        favoriteAppIds={favoriteAppIds}
        language={language}
        onGoHome={() => handleSwitchTab('passport')}
        onToggleBig={handleToggleBig}
        onToggleDayNight={handleToggleDayNight}
        onToggleSpeak={handleToggleSpeakPage}
        onTogglePin={handleTogglePin}
        onToggleSimpleMode={handleToggleSimpleMode}
        onToggleFavoriteApp={handleToggleFavoriteApp}
        onSelectLanguage={(code) => {
          setLanguage(code);
          pushToast(`Langue active : ${code}`, 'info');
        }}
        onNotify={pushToast}
      />

      {/* Barre de navigation 3 onglets du Hub */}
      <nav
        className="no-print w-full border-b"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
        aria-label="Navigation principale du Hub"
      >
        <div className="max-w-5xl mx-auto px-2 sm:px-4">
          <div role="tablist" className="grid grid-cols-3 gap-1">
            <button
              type="button"
              role="tab"
              id="tab-passport"
              aria-controls="panel-passport"
              aria-selected={activeTab === 'passport'}
              onClick={() => handleSwitchTab('passport')}
              className="tab-btn px-2 py-2.5 text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-t-[8px] cursor-pointer"
            >
              <KeyRound size={18} className="shrink-0" aria-hidden="true" />
              <span className="text-[13px] sm:text-[15px] leading-tight whitespace-nowrap">
                Mon Passeport
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-ideas"
              aria-controls="panel-ideas"
              aria-selected={activeTab === 'ideas'}
              onClick={() => handleSwitchTab('ideas')}
              className="tab-btn px-2 py-2.5 text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-t-[8px] cursor-pointer"
            >
              <Lightbulb size={18} className="shrink-0" aria-hidden="true" />
              <span className="text-[13px] sm:text-[15px] leading-tight whitespace-nowrap">
                Boîte à Idées
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-apps"
              aria-controls="panel-apps"
              aria-selected={activeTab === 'apps'}
              onClick={() => handleSwitchTab('apps')}
              className="tab-btn px-2 py-2.5 text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-t-[8px] cursor-pointer"
            >
              <LayoutGrid size={18} className="shrink-0" aria-hidden="true" />
              <span className="text-[13px] sm:text-[15px] leading-tight whitespace-nowrap">
                Les Applis
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu Principal (isolé pour les réglages de taille, police, largeur et filtre daltonisme) */}
      <main
        id="main-content"
        ref={mainRef}
        className="hub-scaled-content hub-color-filter-target flex-1 w-full mx-auto px-4 py-6 sm:py-8"
      >
        {activeTab === 'passport' && (
          <PassportPanel
            passport={passport}
            syncUrl={syncUrl}
            isSimpleMode={isSimpleMode}
            availableVoices={availableVoices}
            onUpdatePassport={handleUpdatePassport}
            onReplacePassport={handleReplacePassport}
            onResetPassport={handleResetPassport}
            onSpeakText={speakText}
            onCopyText={handleCopyText}
            onNotify={pushToast}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasPanel
            ideas={ideas}
            userVotes={userVotes}
            passport={passport}
            aiMode={aiMode}
            onChangeAiMode={setAiMode}
            onPublishIdea={handlePublishIdea}
            onToggleVote={handleToggleVote}
            onSpeakText={speakText}
            onCopyText={handleCopyText}
            onNotify={pushToast}
          />
        )}

        {activeTab === 'apps' && (
          <AppsPanel
            passport={passport}
            onSpeakText={speakText}
            onCopyText={handleCopyText}
            onNotify={pushToast}
          />
        )}
      </main>

      {/* Pied de page sobre */}
      <footer
        className="no-print mt-auto py-5 px-4 text-[14px] text-muted border-t"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            <strong>Alphabette Hub</strong> — Conçu pour tous les yeux et tous les âges (WCAG AAA).
          </p>
          <p>Zéro cookie traceur · Stockage 100% sur votre appareil.</p>
        </div>
      </footer>

      {/* Notifications accessibles (Toast aria-live, 1 seule visible à la fois) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="no-print fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto card-box px-4 py-3 font-bold text-[14px] flex items-center justify-between gap-3"
            style={{
              borderWidth: '2px',
              borderColor:
                toast.type === 'success'
                  ? 'var(--success)'
                  : toast.type === 'error'
                  ? 'var(--danger)'
                  : 'var(--accent)',
            }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts([])}
              aria-label="Fermer la notification"
              className="shrink-0 w-[28px] h-[28px] rounded-[6px] inline-flex items-center justify-center hover:bg-slate-500/15 cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
