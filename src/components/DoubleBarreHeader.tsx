import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart2,
  Crown,
  Heart,
  LayoutGrid,
  Moon,
  MoreHorizontal,
  Star,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ECOSYSTEM_APPS, LANGUAGES } from '../data/ecosystem';
import type { PassportSettings } from '../types';

interface DoubleBarreHeaderProps {
  passport: PassportSettings;
  isBigMode: boolean;
  isDarkVisual: boolean;
  isSpeaking: boolean;
  isPinned: boolean;
  isSimpleMode: boolean;
  favoriteAppIds: string[];
  language: string;
  onGoHome: () => void;
  onToggleBig: () => void;
  onToggleDayNight: () => void;
  onToggleSpeak: () => void;
  onTogglePin: () => void;
  onToggleSimpleMode: () => void;
  onToggleFavoriteApp: (appId: string) => void;
  onSelectLanguage: (code: string) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'error') => void;
}

type HeaderModal =
  | null
  | 'all-apps'
  | 'new-apps'
  | 'subscription'
  | 'donate'
  | 'install'
  | 'feedback'
  | 'language';

export const DoubleBarreHeader: React.FC<DoubleBarreHeaderProps> = ({
  passport,
  isBigMode,
  isDarkVisual,
  isSpeaking,
  isPinned,
  isSimpleMode,
  favoriteAppIds,
  language,
  onGoHome,
  onToggleBig,
  onToggleDayNight,
  onToggleSpeak,
  onTogglePin,
  onToggleSimpleMode,
  onToggleFavoriteApp,
  onSelectLanguage,
  onNotify,
}) => {
  const [activeModal, setActiveModal] = useState<HeaderModal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHighContrast = passport.theme === 'high-contrast';

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setActiveModal(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const newApps = ECOSYSTEM_APPS.filter((a) => a.isNew);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      onNotify('Écrivez quelques mots pour partager votre avis.', 'error');
      return;
    }
    setFeedbackText('');
    setActiveModal(null);
    onNotify('Merci pour votre avis ! Votre retour aide à améliorer Alphabette.', 'success');
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 w-full select-none">
        {/* 1. BARRE SUPÉRIEURE (Top Bar Écosystème) — Dimensions 100% en px fixes */}
        <div
          className={`w-full h-[46px] sm:h-[50px] px-[10px] sm:px-[16px] flex items-center justify-between gap-[6px] flex-nowrap ${
            isHighContrast
              ? 'bg-black text-white border-b-2 border-white'
              : isDarkVisual
              ? 'bg-[#0b1220] text-white'
              : 'bg-[#182334] text-white'
          }`}
        >
          {/* Bloc de gauche : Logo+Nom, .eu, Toutes les applis, NEW */}
          <div className="flex items-center gap-[6px] sm:gap-[10px] min-w-0 flex-nowrap">
            {/* 1. Logo + Nom (alphabette) */}
            <a
              href="https://alphabette.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[6px] shrink-0 whitespace-nowrap hover:opacity-90 transition-opacity rounded-[8px] py-[2px]"
              aria-label="Alphabette — Site vitrine alphabette.fr"
            >
              <span
                className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full bg-[#3355d1] text-white font-bold text-[15px] sm:text-[16px] leading-none flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                a
              </span>
              <span className="font-bold lowercase tracking-tight text-[15px] sm:text-[17px] leading-none text-white">
                alphabette
              </span>
            </a>

            {/* 2. Bouton .eu */}
            <a
              href="https://alphabette.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-[12px] sm:text-[13px] leading-none flex items-center justify-center shrink-0 transition-colors"
              aria-label="Laboratoire alphabette.eu"
              title="Laboratoire alphabette.eu"
            >
              .eu
            </a>

            {/* 3. Bouton Toutes les applis */}
            <button
              type="button"
              onClick={() => setActiveModal('all-apps')}
              aria-label="Toutes les applis de la suite Alphabette"
              className="w-[34px] h-[34px] sm:w-auto sm:h-[36px] sm:px-[10px] rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center gap-[6px] shrink-0 transition-colors cursor-pointer"
            >
              <LayoutGrid size={17} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline text-[12.5px] font-semibold leading-none whitespace-nowrap">
                Toutes les applis
              </span>
            </button>

            {/* 4. Bouton NEW */}
            <button
              type="button"
              onClick={() => setActiveModal('new-apps')}
              aria-label="Nouveautés de la suite Alphabette"
              className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full bg-white/10 hover:bg-white/20 inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <span className="px-[4px] py-[2px] rounded-[4px] bg-gradient-to-b from-sky-200 to-sky-400 text-[#0f172a] text-[9px] font-extrabold uppercase leading-none tracking-tight">
                NEW
              </span>
            </button>
          </div>

          {/* Bloc de droite : 5. Bouton Abonnement */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setActiveModal('subscription')}
              aria-label="Informations sur l'abonnement Alphabette"
              className="h-[34px] sm:h-[36px] px-[10px] sm:px-[14px] rounded-full bg-white/10 hover:bg-white/15 border-[1.5px] border-[#f59e0b] text-[#fbbf24] inline-flex items-center justify-center gap-[5px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Crown size={14} className="text-[#f59e0b] shrink-0" aria-hidden="true" />
              <span className="text-[12.5px] sm:text-[13.5px] font-bold leading-none whitespace-nowrap">
                Abonnement
              </span>
            </button>
          </div>
        </div>

        {/* 2. BARRE INFÉRIEURE (Barre d'Application & Accessibilité) — Dimensions 100% en px fixes */}
        <div
          className={`w-full h-[54px] sm:h-[58px] px-[10px] sm:px-[16px] flex items-center justify-between gap-[6px] flex-nowrap ${
            isHighContrast
              ? 'bg-black text-white border-b-2 border-[#ffd700]'
              : passport.theme === 'high-contrast-light'
              ? 'bg-white text-black border-b-2 border-black'
              : passport.theme === 'sepia'
              ? 'bg-[#fbf7ee] text-[#231a12] border-b border-[#cbbba0]'
              : isDarkVisual
              ? 'bg-[#0f172a] text-white border-b border-[#334155]'
              : 'bg-white text-[#0f172a] border-b border-[#e2e8f0]'
          }`}
        >
          {/* Bloc de gauche : Titre + Sous-titre (<= 25 caractères) */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <button
              type="button"
              onClick={onGoHome}
              className="text-left inline-flex items-center gap-[5px] min-w-0 max-w-full cursor-pointer rounded-[6px]"
              aria-label="Retour à l'accueil Mon Passeport Alphabette Hub"
            >
              <span
                className={`font-bold tracking-tight text-[14.5px] sm:text-[20px] leading-[1.15] truncate ${
                  isHighContrast
                    ? 'text-[#ffd700]'
                    : passport.theme === 'high-contrast-light'
                    ? 'text-black'
                    : isDarkVisual
                    ? 'text-white'
                    : 'text-[#3f51b5]'
                }`}
              >
                Alphabette Hub
              </span>
              {isPinned && (
                <Star
                  size={13}
                  className="text-[#f59e0b] fill-[#f59e0b] shrink-0"
                  aria-label="Application épinglée"
                />
              )}
            </button>
            <span
              className={`text-[9px] sm:text-[10.5px] uppercase tracking-[0.04em] leading-[1.2] truncate ${
                isHighContrast
                  ? 'text-white'
                  : passport.theme === 'high-contrast-light'
                  ? 'text-black'
                  : isDarkVisual
                  ? 'text-[#94a3b8]'
                  : 'text-[#64748b]'
              }`}
            >
              PASSEPORT &amp; LABO AAA
            </span>
          </div>

          {/* Bloc de droite : Exactement 5 boutons d'action en px fixes */}
          <div className="flex items-center gap-[4px] sm:gap-[7px] shrink-0 flex-nowrap">
            {/* 1. Bouton Don */}
            <button
              type="button"
              onClick={() => setActiveModal('donate')}
              aria-label="Soutenir Alphabette par un don"
              title="Soutenir Alphabette"
              className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-[10px] sm:rounded-[11px] bg-[#db2777] hover:bg-[#be185d] text-white inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Heart size={17} className="fill-white text-white" aria-hidden="true" />
            </button>

            {/* 2. Bouton BIG */}
            <button
              type="button"
              onClick={onToggleBig}
              aria-pressed={isBigMode}
              aria-label={isBigMode ? 'Désactiver le mode grand texte BIG' : 'Activer le mode grand texte BIG'}
              title="Mode grand texte BIG"
              className={`h-[34px] sm:h-[38px] px-[8px] sm:px-[11px] rounded-[10px] sm:rounded-[11px] inline-flex items-center justify-center gap-[4px] shrink-0 transition-colors cursor-pointer ${
                isBigMode
                  ? 'bg-[#312e81] ring-2 ring-[#f59e0b] text-white'
                  : 'bg-[#4338ca] hover:bg-[#3730a3] text-white'
              }`}
            >
              <span className="font-bold text-[12px] sm:text-[14px] leading-none tracking-tight">
                BIG
              </span>
              <BarChart2 size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>

            {/* 3. Bouton Mode Nuit / Jour */}
            <button
              type="button"
              onClick={onToggleDayNight}
              aria-label={isDarkVisual ? 'Passer en mode jour clair' : 'Passer en mode nuit sombre'}
              title={isDarkVisual ? 'Mode jour' : 'Mode nuit'}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isHighContrast
                  ? 'bg-black border-2 border-[#ffd700] text-[#ffd700]'
                  : isDarkVisual
                  ? 'bg-[#1e293b] border border-[#334155] text-[#fbbf24] hover:bg-[#334155]'
                  : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#334155] hover:bg-[#e2e8f0]'
              }`}
            >
              {isDarkVisual ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
            </button>

            {/* 4. Bouton Lecture à haute voix */}
            <button
              type="button"
              onClick={onToggleSpeak}
              aria-pressed={isSpeaking}
              aria-label={isSpeaking ? 'Arrêter la lecture à haute voix' : 'Lire la page à haute voix'}
              title={isSpeaking ? 'Arrêter la lecture' : 'Lecture à haute voix'}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-[#047857] text-white border border-[#047857]'
                  : isHighContrast
                  ? 'bg-black border-2 border-white text-white'
                  : isDarkVisual
                  ? 'bg-[#1e293b] border border-[#334155] text-white hover:bg-[#334155]'
                  : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#334155] hover:bg-[#e2e8f0]'
              }`}
            >
              {isSpeaking ? (
                <VolumeX size={17} aria-hidden="true" />
              ) : (
                <Volume2 size={17} aria-hidden="true" />
              )}
            </button>

            {/* 5. Bouton Plus d'options (...) */}
            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Plus d'options"
                title="Plus d'options"
                className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isHighContrast
                    ? 'bg-black border-2 border-white text-white'
                    : isDarkVisual
                    ? 'bg-[#1e293b] border border-[#334155] text-white hover:bg-[#334155]'
                    : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#334155] hover:bg-[#e2e8f0]'
                }`}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Menu options de l'application"
                  className={`absolute right-0 mt-[8px] w-[260px] rounded-[14px] py-[6px] shadow-xl z-50 text-[14px] ${
                    isHighContrast
                      ? 'bg-black text-white border-2 border-[#ffd700]'
                      : isDarkVisual
                      ? 'bg-[#162032] text-[#f8fafc] border border-[#334155]'
                      : 'bg-white text-[#0f172a] border border-[#e2e8f0]'
                  }`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onTogglePin();
                      setMenuOpen(false);
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>⭐ Épingler cette appli</span>
                    {isPinned && <span className="text-[11px] font-bold text-[#f59e0b]">Actif</span>}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('subscription');
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>👤 Mon inscription</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onToggleSimpleMode();
                      setMenuOpen(false);
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>🧘 Mode simple</span>
                    {isSimpleMode && <span className="text-[11px] font-bold text-[#10b981]">Actif</span>}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('install');
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>📱 Installer sur mon téléphone</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('feedback');
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>💬 Donner mon avis</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      window.print();
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>🖨️ Imprimer</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveModal('language');
                    }}
                    className="w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-[8px] hover:bg-slate-500/15 transition-colors cursor-pointer"
                  >
                    <span>🌐 Langue</span>
                    <span className="text-[12px] font-bold opacity-80">{language}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MODALES AUTONOMES DE LA DOUBLE BARRE
          ===================================================================== */}

      {/* Modale 1 : Toutes les applis */}
      {activeModal === 'all-apps' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-all-apps-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-all-apps-title" className="text-[20px] font-bold">
                Toutes les applis Alphabette
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer la liste des applications"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-[14px] text-muted">
              Ajoutez vos applications favorites avec l&apos;étoile pour les retrouver rapidement.
            </p>

            <ul className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {ECOSYSTEM_APPS.map((app) => {
                const isFav = favoriteAppIds.includes(app.id);
                return (
                  <li
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <span className="font-bold text-[15px] block">{app.name}</span>
                      <span className="text-[13px] text-muted block truncate">{app.shortDesc}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteApp(app.id)}
                      aria-pressed={isFav}
                      aria-label={
                        isFav
                          ? `Retirer ${app.name} des favoris`
                          : `Ajouter ${app.name} aux favoris`
                      }
                      className="w-[40px] h-[40px] rounded-[10px] inline-flex items-center justify-center text-[20px] hover:bg-slate-500/15 shrink-0 cursor-pointer"
                    >
                      {isFav ? '⭐' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-primary text-[15px]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale 2 : Nouveautés (NEW) */}
      {activeModal === 'new-apps' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-apps-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-new-apps-title" className="text-[20px] font-bold">
                Nouveautés du Labo Alphabette
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer la fenêtre des nouveautés"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <ul className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {newApps.map((app) => {
                const isFav = favoriteAppIds.includes(app.id);
                return (
                  <li
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[15px] hover:underline block"
                      >
                        {app.name}
                      </a>
                      <p className="text-[13px] text-muted">{app.shortDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteApp(app.id)}
                      aria-pressed={isFav}
                      aria-label={
                        isFav
                          ? `Retirer ${app.name} des favoris`
                          : `Ajouter ${app.name} aux favoris`
                      }
                      className="w-[40px] h-[40px] rounded-[10px] inline-flex items-center justify-center text-[20px] hover:bg-slate-500/15 shrink-0 cursor-pointer"
                    >
                      {isFav ? '⭐' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-primary text-[15px]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale 3 : Abonnement (7 mai — 15 €/an ou 40 €/an) */}
      {activeModal === 'subscription' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sub-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown size={22} className="text-[#f59e0b]" aria-hidden="true" />
                <h2 id="modal-sub-title" className="text-[20px] font-bold">
                  Abonnement Alphabette
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer les informations d'abonnement"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-[15px]">
              L&apos;abonnement payant Alphabette sera lancé le <strong>7 mai</strong> pour
              soutenir durablement un écosystème indépendant, sans publicité et respectueux de
              votre vie privée.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="surface-box rounded-[12px] p-4 space-y-1">
                <p className="font-bold text-[16px]">Une appli</p>
                <p className="text-[22px] font-bold tabular-nums">15 € / an</p>
                <p className="text-[13px] text-muted">
                  Accès complet à votre application favorite sur web et mobile.
                </p>
              </div>
              <div
                className="surface-box rounded-[12px] p-4 space-y-1"
                style={{ borderColor: '#f59e0b', borderWidth: '2px' }}
              >
                <p className="font-bold text-[16px]">Toutes les applis</p>
                <p className="text-[22px] font-bold tabular-nums">40 € / an</p>
                <p className="text-[13px] text-muted">
                  Toute la suite Alphabette + les nouveautés du laboratoire .eu.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-primary text-[15px]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale 4 : Don / Soutien */}
      {activeModal === 'donate' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-donate-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-md p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-[#db2777] fill-[#db2777]" aria-hidden="true" />
                <h2 id="modal-donate-title" className="text-[20px] font-bold">
                  Soutenir Alphabette
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer la fenêtre de soutien"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-[15px] text-muted">
              Alphabette est développé de manière indépendante, sans publicité et sans revente de
              données. Votre soutien finance l&apos;hébergement européen et l&apos;accessibilité WCAG AAA.
            </p>

            <div className="flex flex-wrap gap-2">
              {['5 €', '10 €', '20 €'].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    onNotify(`Merci pour votre intention de soutien de ${amount} !`, 'success');
                  }}
                  className="btn-aaa btn-secondary flex-1 text-[15px]"
                >
                  {amount}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-primary text-[15px]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale 5 : Installer sur mon téléphone */}
      {activeModal === 'install' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-install-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-md p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-install-title" className="text-[20px] font-bold">
                Installer sur mon téléphone
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer les instructions d'installation"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3 text-[14px]">
              <div className="surface-box rounded-[12px] p-3.5">
                <p className="font-bold">Sur Android (Chrome)</p>
                <p className="text-muted">
                  Touchez le menu ⋮ en haut à droite puis choisissez « Ajouter à l&apos;écran
                  d&apos;accueil » ou « Installer l&apos;application ».
                </p>
              </div>
              <div className="surface-box rounded-[12px] p-3.5">
                <p className="font-bold">Sur iPhone / iPad (Safari)</p>
                <p className="text-muted">
                  Touchez l&apos;icône Partager en bas de l&apos;écran puis « Sur l&apos;écran
                  d&apos;accueil ».
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-primary text-[15px]"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale 6 : Donner mon avis */}
      {activeModal === 'feedback' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-feedback-title"
          onClick={() => setActiveModal(null)}
        >
          <form
            onSubmit={handleFeedbackSubmit}
            className="card-box w-full max-w-md p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-feedback-title" className="text-[20px] font-bold">
                Donner mon avis
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer la fenêtre d'avis"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2" role="group" aria-label="Note sur 5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  aria-pressed={feedbackRating >= star}
                  aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                  className="w-[42px] h-[42px] rounded-[10px] surface-box text-[20px] cursor-pointer"
                >
                  {feedbackRating >= star ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="header-feedback-input" className="block text-[14px] font-bold mb-1.5">
                Votre message
              </label>
              <textarea
                id="header-feedback-input"
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Ce qui vous plaît ou ce que nous pouvons simplifier..."
                className="input-aaa w-full p-3 !text-[15px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-aaa btn-secondary text-[15px]"
              >
                Annuler
              </button>
              <button type="submit" className="btn-aaa btn-primary text-[15px]">
                Envoyer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modale 7 : Langue */}
      {activeModal === 'language' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-lang-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card-box w-full max-w-sm p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-lang-title" className="text-[20px] font-bold">
                Langue de l&apos;interface
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Fermer le sélecteur de langue"
                className="btn-aaa btn-secondary !min-h-[40px] !min-w-[40px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  disabled={!item.available}
                  onClick={() => {
                    onSelectLanguage(item.code);
                    setActiveModal(null);
                  }}
                  className="btn-aaa btn-option w-full justify-between text-[15px]"
                  aria-pressed={language === item.code}
                >
                  <span>{item.label}</span>
                  <span className="font-bold">{item.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
