import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Download,
  Eye,
  Hand,
  Import,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Upload,
  Volume2,
} from 'lucide-react';
import { DEFAULT_PASSPORT, PASSPORT_PRESETS } from '../data/ecosystem';
import type {
  PassportAccentColor,
  PassportButtonSize,
  PassportColorBlindFilter,
  PassportFocusStyle,
  PassportFontFamily,
  PassportFontSize,
  PassportLetterSpacing,
  PassportLineHeight,
  PassportPreset,
  PassportReadingWidth,
  PassportSectionFilter,
  PassportSettings,
  PassportTheme,
  PassportWarmth,
  SpeechPitch,
  SpeechRate,
} from '../types';
import {
  countActiveCustomizations,
  parseImportedPassportInput,
} from '../utils/hubLogic';

interface PassportPanelProps {
  passport: PassportSettings;
  syncUrl: string;
  isSimpleMode: boolean;
  availableVoices: SpeechSynthesisVoice[];
  onUpdatePassport: (patch: Partial<PassportSettings>) => void;
  onReplacePassport: (next: PassportSettings, message: string) => void;
  onResetPassport: () => void;
  onSpeakText: (text: string) => void;
  onCopyText: (text: string, message: string) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const PassportPanel: React.FC<PassportPanelProps> = ({
  passport,
  syncUrl,
  isSimpleMode,
  availableVoices,
  onUpdatePassport,
  onReplacePassport,
  onResetPassport,
  onSpeakText,
  onCopyText,
  onNotify,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<PassportSectionFilter>('all');
  const [importInput, setImportInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(syncUrl, {
      width: 156,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [syncUrl]);

  const activeCustomizations = countActiveCustomizations(passport);
  const showSection = (id: Exclude<PassportSectionFilter, 'all'>) =>
    sectionFilter === 'all' || sectionFilter === id;

  const handleApplyPreset = (preset: PassportPreset) => {
    const next: PassportSettings = {
      ...DEFAULT_PASSPORT,
      ...preset.settings,
      version: 2,
    };
    onReplacePassport(next, `Profil « ${preset.label} » appliqué !`);
  };

  const handleImportText = () => {
    try {
      const parsed = parseImportedPassportInput(importInput);
      onReplacePassport(parsed, 'Passeport importé et appliqué avec succès !');
      setImportInput('');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Lien ou code Passeport invalide.',
        'error'
      );
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(passport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alphabette-passeport.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Sauvegarde alphabette-passeport.json téléchargée.', 'success');
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = String(reader.result || '');
        const parsed = parseImportedPassportInput(content);
        onReplacePassport(parsed, `Passeport restauré depuis ${file.name} !`);
      } catch {
        onNotify('Ce fichier ne contient pas un Passeport Alphabette valide.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const sectionTabs: { id: PassportSectionFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Tous les réglages', icon: <SlidersHorizontal size={17} aria-hidden="true" /> },
    { id: 'vision', label: 'Vision & Couleurs', icon: <Eye size={17} aria-hidden="true" /> },
    { id: 'text', label: 'Texte & Lecture', icon: <Type size={17} aria-hidden="true" /> },
    { id: 'motor', label: 'Motricité & Confort', icon: <Hand size={17} aria-hidden="true" /> },
    { id: 'voice', label: 'Voix & Audio', icon: <Volume2 size={17} aria-hidden="true" /> },
  ];

  const themeOptions: { value: PassportTheme; label: string; sub: string }[] = [
    { value: 'light', label: 'Clair Haute Visibilité', sub: 'Blanc pur & bleu profond' },
    { value: 'sepia', label: 'Papier Sépia', sub: 'Crème doux anti-éblouissement' },
    { value: 'onyx', label: 'Sombre Onyx', sub: 'Reposant la nuit' },
    { value: 'high-contrast', label: 'Contraste Max Sombre', sub: 'Noir pur & jaune #FFD700' },
    { value: 'high-contrast-light', label: 'Contraste Max Clair', sub: 'Blanc pur & noir 21:1' },
  ];

  const accentOptions: { value: PassportAccentColor; label: string; swatch: string }[] = [
    { value: 'blue', label: 'Bleu Alphabette', swatch: '#00449e' },
    { value: 'emerald', label: 'Vert Émeraude', swatch: '#046c4e' },
    { value: 'violet', label: 'Indigo Profond', swatch: '#4c1d95' },
    { value: 'amber', label: 'Ambre Chaud', swatch: '#92400e' },
  ];

  const colorBlindOptions: { value: PassportColorBlindFilter; label: string }[] = [
    { value: 'none', label: 'Aucun filtre' },
    { value: 'protanopia', label: 'Protanopie (Rouge)' },
    { value: 'deuteranopia', label: 'Deutéranopie (Vert)' },
    { value: 'tritanopia', label: 'Tritanopie (Bleu)' },
    { value: 'grayscale', label: 'Niveaux de gris' },
  ];

  const warmthOptions: { value: PassportWarmth; label: string }[] = [
    { value: 0, label: 'Désactivé' },
    { value: 1, label: 'Teinte douce' },
    { value: 2, label: 'Confort nuit fort' },
  ];

  const fontSizeOptions: { value: PassportFontSize; label: string; sub: string }[] = [
    { value: 'normal', label: 'Aa Normal', sub: 'Standard (16px)' },
    { value: 'lg', label: 'Aa Grand', sub: 'Confort (20px)' },
    { value: 'xl', label: 'Aa Très Grand', sub: 'Maxi (22px)' },
    { value: 'xxl', label: 'Aa Ultra', sub: 'Basse vision (25px)' },
  ];

  const fontFamilyOptions: { value: PassportFontFamily; label: string; sub: string }[] = [
    { value: 'standard', label: 'Atkinson Hyperlegible', sub: 'Lettres ultra-distinctes' },
    { value: 'dyslexic', label: 'Confort Dys', sub: 'Mots et lignes aérés' },
    { value: 'serif', label: 'Livre (Serif)', sub: 'Repères classiques' },
    { value: 'mono', label: 'Chasse fixe (Mono)', sub: 'Alignement régulier' },
  ];

  const lineHeightOptions: { value: PassportLineHeight; label: string }[] = [
    { value: 'compact', label: 'Compact (1.4)' },
    { value: 'normal', label: 'Normal (1.6)' },
    { value: 'relaxed', label: 'Aéré (1.9)' },
    { value: 'double', label: 'Double (2.2)' },
  ];

  const letterSpacingOptions: { value: PassportLetterSpacing; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'wide', label: 'Élargi (+5%)' },
    { value: 'extra', label: 'Très large (+11%)' },
  ];

  const readingWidthOptions: { value: PassportReadingWidth; label: string }[] = [
    { value: 'narrow', label: 'Colonne étroite (focalisée)' },
    { value: 'normal', label: 'Largeur confort' },
    { value: 'wide', label: 'Pleine largeur' },
  ];

  const buttonSizeOptions: { value: PassportButtonSize; label: string; sub: string }[] = [
    { value: 'normal', label: 'Standard', sub: '48 px minimum' },
    { value: 'large', label: 'Grand', sub: '58 px confortable' },
    { value: 'xl', label: 'Très Grand', sub: '68 px motricité fine' },
  ];

  const focusStyleOptions: { value: PassportFocusStyle; label: string; sub: string }[] = [
    { value: 'standard', label: 'Standard', sub: 'Bordures 1px & focus 3px' },
    { value: 'strong', label: 'Renforcé', sub: 'Bordures 2px & focus 4px' },
  ];

  const speechRateOptions: { value: SpeechRate; label: string }[] = [
    { value: 0.65, label: 'Très lente (0.65x)' },
    { value: 0.8, label: 'Lente (0.8x)' },
    { value: 1, label: 'Normale (1x)' },
    { value: 1.25, label: 'Rapide (1.25x)' },
    { value: 1.5, label: 'Très rapide (1.5x)' },
  ];

  const speechPitchOptions: { value: SpeechPitch; label: string }[] = [
    { value: 0.8, label: 'Grave (0.8)' },
    { value: 1, label: 'Naturelle (1.0)' },
    { value: 1.2, label: 'Claire (1.2)' },
  ];

  const handleResetClick = () => {
    if (passport.confirmActions) {
      setConfirmReset((v) => !v);
    } else {
      onResetPassport();
      setConfirmReset(false);
    }
  };

  return (
    <section
      id="panel-passport"
      role="tabpanel"
      aria-labelledby="tab-passport"
      className="space-y-6"
    >
      {/* En-tête + compteur de réglages personnalisés */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="hub-sm font-bold text-muted">
            100% Local · Sans compte · Sans cookie ·{' '}
            <span className="tabular-nums" data-testid="active-customizations-count">
              {activeCustomizations} réglage{activeCustomizations > 1 ? 's' : ''} personnalisé
              {activeCustomizations > 1 ? 's' : ''}
            </span>
          </p>
          <h1 className="hub-h1 font-bold">Mon Passeport Alphabette</h1>
          <p className="text-muted max-w-3xl">
            Personnalisez finement votre confort visuel, typographique, moteur et vocal. Tous vos
            réglages s&apos;appliquent en direct et se transfèrent sans compte via QR Code ou lien.
          </p>
        </div>
      </div>

      {/* Profils rapides en 1 clic */}
      <article className="card-box p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="hub-h3 font-bold">Profils rapides en 1 clic</h2>
            <p className="hub-sm text-muted">
              Démarrez avec un profil complet puis ajustez chaque détail ci-dessous.
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          role="group"
          aria-label="Profils rapides d'accessibilité"
        >
          {PASSPORT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="btn-aaa btn-secondary flex-col items-start text-left !justify-start"
            >
              <span className="font-bold">{preset.label}</span>
              <span className="text-[13px] font-normal text-muted leading-snug">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </article>

      {/* Filtre rapide par catégorie de réglages */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrer les catégories de réglages du Passeport"
      >
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={sectionFilter === tab.id}
            onClick={() => setSectionFilter(tab.id)}
            className="btn-aaa btn-option hub-sm"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ====================================================================
          BLOC 1 : VISION, COULEURS & FILTRES
          ==================================================================== */}
      {showSection('vision') && (
        <article className="card-box p-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              aria-hidden="true"
            >
              1
            </span>
            <div>
              <h2 className="hub-h2 font-bold">Vision, Couleurs &amp; Filtres</h2>
              <p className="hub-sm text-muted">
                5 ambiances WCAG AAA, couleur d&apos;accentuation, adaptation daltonisme et filtre lumière bleue.
              </p>
            </div>
          </div>

          {/* 5 thèmes */}
          <div className="space-y-2">
            <p className="font-bold">Ambiance visuelle</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              role="group"
              aria-label="Thème visuel"
            >
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.theme === opt.value}
                  onClick={() => onUpdatePassport({ theme: opt.value })}
                  className="btn-aaa btn-option flex-col text-center"
                >
                  <span>{opt.label}</span>
                  <span className="text-[13px] opacity-85 font-normal">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Couleur d'accentuation */}
          <div
            className="pt-4 border-t space-y-2.5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <p className="font-bold">Couleur d&apos;accentuation</p>
              <p className="hub-sm text-muted">
                Personnalise les boutons et repères actifs sur les thèmes Clair, Sépia et Sombre Onyx.
              </p>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              role="group"
              aria-label="Couleur d'accentuation"
            >
              {accentOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.accentColor === opt.value}
                  onClick={() => onUpdatePassport({ accentColor: opt.value })}
                  className="btn-aaa btn-option hub-sm"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/60 shrink-0"
                    style={{ backgroundColor: opt.swatch }}
                    aria-hidden="true"
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Adaptation daltonisme */}
          <div
            className="pt-4 border-t space-y-2.5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <p className="font-bold">Adaptation daltonisme &amp; perception des couleurs</p>
              <p className="hub-sm text-muted">
                Applique un filtre chromatique dédié sur le contenu principal.
              </p>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
              role="group"
              aria-label="Filtre daltonisme"
            >
              {colorBlindOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.colorBlindFilter === opt.value}
                  onClick={() => onUpdatePassport({ colorBlindFilter: opt.value })}
                  className="btn-aaa btn-option hub-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre lumière bleue */}
          <div
            className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <p className="font-bold">Filtre lumière bleue (Teinte chaude)</p>
              <p className="hub-sm text-muted">
                Adoucit la luminosité de l&apos;écran le soir ou en cas de fatigue oculaire.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0" role="group" aria-label="Filtre lumière bleue">
              {warmthOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.warmth === opt.value}
                  onClick={() => onUpdatePassport({ warmth: opt.value })}
                  className="btn-aaa btn-option hub-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </article>
      )}

      {/* ====================================================================
          BLOC 2 : TEXTE, TYPOGRAPHIE & LECTURE
          ==================================================================== */}
      {showSection('text') && (
        <article className="card-box p-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              aria-hidden="true"
            >
              2
            </span>
            <div>
              <h2 className="hub-h2 font-bold">Texte, Typographie &amp; Lecture</h2>
              <p className="hub-sm text-muted">
                Taille du texte (synchronisée avec BIG), police, interligne, espacement et aides à la lecture.
              </p>
            </div>
          </div>

          {/* Taille du texte */}
          <div className="space-y-2">
            <p className="font-bold">Taille de texte idéale</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              role="group"
              aria-label="Taille de texte"
            >
              {fontSizeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.fontSize === opt.value}
                  onClick={() => onUpdatePassport({ fontSize: opt.value })}
                  className="btn-aaa btn-option flex-col"
                >
                  <span>{opt.label}</span>
                  <span className="text-[13px] opacity-85 font-normal">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style de police */}
          <div
            className="pt-4 border-t space-y-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <p className="font-bold">Style de police</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              role="group"
              aria-label="Police de caractères"
            >
              {fontFamilyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.fontFamily === opt.value}
                  onClick={() => onUpdatePassport({ fontFamily: opt.value })}
                  className="btn-aaa btn-option flex-col text-center"
                >
                  <span>{opt.label}</span>
                  <span className="text-[13px] opacity-85 font-normal">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interligne & Espacement des lettres */}
          <div
            className="pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="space-y-2">
              <p className="font-bold">Hauteur de ligne (Interligne)</p>
              <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Interligne">
                {lineHeightOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={passport.lineHeight === opt.value}
                    onClick={() => onUpdatePassport({ lineHeight: opt.value })}
                    className="btn-aaa btn-option hub-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold">Espacement des lettres</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Espacement des lettres">
                {letterSpacingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={passport.letterSpacing === opt.value}
                    onClick={() => onUpdatePassport({ letterSpacing: opt.value })}
                    className="btn-aaa btn-option hub-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Largeur de lecture */}
          <div
            className="pt-4 border-t space-y-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <p className="font-bold">Largeur de la colonne de lecture</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Largeur de lecture">
              {readingWidthOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.readingWidth === opt.value}
                  onClick={() => onUpdatePassport({ readingWidth: opt.value })}
                  className="btn-aaa btn-option hub-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interrupteurs d'aide à la lecture */}
          <div
            className="pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="underline-links-label" className="font-bold block">
                  Souligner systématiquement tous les liens
                </span>
                <p className="hub-sm text-muted">
                  Rend chaque lien cliquable immédiatement reconnaissable sans dépendre de la couleur.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="underline-links-label"
                aria-checked={passport.underlineLinks}
                onClick={() => onUpdatePassport({ underlineLinks: !passport.underlineLinks })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.underlineLinks ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="reading-guide-label" className="font-bold block">
                  Règle de lecture (Guide de ligne)
                </span>
                <p className="hub-sm text-muted">
                  Affiche un repère horizontal doux qui suit votre pointeur pour ne pas sauter de ligne.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="reading-guide-label"
                aria-checked={passport.readingGuide}
                onClick={() => onUpdatePassport({ readingGuide: !passport.readingGuide })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.readingGuide ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ====================================================================
          BLOC 3 : MOTRICITÉ & CONFORT SENSORIEL
          ==================================================================== */}
      {showSection('motor') && (
        <article className="card-box p-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              aria-hidden="true"
            >
              3
            </span>
            <div>
              <h2 className="hub-h2 font-bold">Motricité &amp; Confort sensoriel</h2>
              <p className="hub-sm text-muted">
                Agrandissez les zones tactiles, renforcez les bordures et supprimez les animations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold">Taille des boutons &amp; zones tactiles</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              role="group"
              aria-label="Taille des boutons"
            >
              {buttonSizeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.buttonSize === opt.value}
                  onClick={() => onUpdatePassport({ buttonSize: opt.value })}
                  className="btn-aaa btn-option flex-col"
                >
                  <span>{opt.label}</span>
                  <span className="text-[13px] opacity-85 font-normal">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="pt-4 border-t space-y-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <p className="font-bold">Épaisseur des bordures &amp; focus clavier</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="group"
              aria-label="Style des bordures et focus"
            >
              {focusStyleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.focusStyle === opt.value}
                  onClick={() => onUpdatePassport({ focusStyle: opt.value })}
                  className="btn-aaa btn-option flex-col"
                >
                  <span>{opt.label}</span>
                  <span className="text-[13px] opacity-85 font-normal">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="reduced-motion-label" className="font-bold block">
                  Réduire toutes les animations
                </span>
                <p className="hub-sm text-muted">
                  Supprime les transitions et mouvements (confort vestibulaire et anti-distraction).
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="reduced-motion-label"
                aria-checked={passport.reducedMotion}
                onClick={() => onUpdatePassport({ reducedMotion: !passport.reducedMotion })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.reducedMotion ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="large-cursor-label" className="font-bold block">
                  Curseur haute visibilité
                </span>
                <p className="hub-sm text-muted">
                  Agrandit le pointeur souris avec contour doré contrasté sur l&apos;application.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="large-cursor-label"
                aria-checked={passport.largeCursor}
                onClick={() => onUpdatePassport({ largeCursor: !passport.largeCursor })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.largeCursor ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="confirm-actions-label" className="font-bold block">
                  Demander confirmation avant réinitialisation
                </span>
                <p className="hub-sm text-muted">
                  Évite les clics accidentels sur les actions importantes.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="confirm-actions-label"
                aria-checked={passport.confirmActions}
                onClick={() => onUpdatePassport({ confirmActions: !passport.confirmActions })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.confirmActions ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ====================================================================
          BLOC 4 : VOIX, AUDIO & SYNTHÈSE VOCALE
          ==================================================================== */}
      {showSection('voice') && (
        <article className="card-box p-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              aria-hidden="true"
            >
              4
            </span>
            <div>
              <h2 className="hub-h2 font-bold">Voix, Audio &amp; Synthèse vocale</h2>
              <p className="hub-sm text-muted">
                Vitesse sur 5 niveaux, tonalité, choix de la voix française et annonces automatiques.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold">Vitesse de lecture</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
              role="group"
              aria-label="Vitesse de la voix"
            >
              {speechRateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={passport.speechRate === opt.value}
                  onClick={() => onUpdatePassport({ speechRate: opt.value })}
                  className="btn-aaa btn-option hub-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="space-y-2">
              <p className="font-bold">Tonalité de la voix</p>
              <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Tonalité de la voix">
                {speechPitchOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={passport.speechPitch === opt.value}
                    onClick={() => onUpdatePassport({ speechPitch: opt.value })}
                    className="btn-aaa btn-option hub-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="passport-voice-select" className="font-bold block">
                Voix française de l&apos;appareil
              </label>
              <select
                id="passport-voice-select"
                value={passport.voiceName}
                onChange={(e) => onUpdatePassport({ voiceName: e.target.value })}
                className="input-aaa w-full px-3.5 py-2.5 min-h-[48px]"
              >
                <option value="">Automatique (voix française par défaut)</option>
                {availableVoices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="autoread-label" className="font-bold block">
                  Lecture automatique des changements d&apos;écran
                </span>
                <p className="hub-sm text-muted">
                  Annonce vocalement l&apos;onglet sélectionné lors de votre navigation.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="autoread-label"
                aria-checked={passport.autoRead}
                onClick={() => {
                  const next = !passport.autoRead;
                  onUpdatePassport({ autoRead: next });
                  if (next) {
                    onSpeakText('Lecture automatique activée.');
                  }
                }}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.autoRead ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span id="speak-toasts-label" className="font-bold block">
                  Lire les confirmations et alertes à voix haute
                </span>
                <p className="hub-sm text-muted">
                  Lit vocalement chaque message de confirmation ou d&apos;erreur.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-labelledby="speak-toasts-label"
                aria-checked={passport.speakToasts}
                onClick={() => onUpdatePassport({ speakToasts: !passport.speakToasts })}
                className="btn-aaa btn-option shrink-0 min-w-[110px]"
              >
                {passport.speakToasts ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ====================================================================
          APERÇU EN DIRECT & SYNCHRONISATION / SAUVEGARDE ZERO-KNOWLEDGE
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Carte Aperçu en direct */}
        <article className="card-box p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <p className="hub-sm font-bold text-muted">
              Aperçu en direct{isSimpleMode ? ' · Mode simple actif' : ''}
            </p>
            <h2 className="hub-h2 font-bold">Bonjour ! Voici votre confort de lecture.</h2>
            <p className="text-muted">
              Ce texte reflète instantanément votre police, interligne, espacement et contraste.
              Les chiffres <strong className="tabular-nums">14h30</strong> ou les caractères proches{' '}
              <strong>Il1 / O0</strong> restent nets, tout comme ce{' '}
              <a
                href="https://alphabette.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
                style={{ color: 'var(--accent)' }}
              >
                lien exemple vers alphabette.fr
              </a>
              .
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  onSpeakText(
                    'Bonjour ! Voici votre confort de lecture Alphabette. Tous les réglages de votre passeport sont prêts.'
                  )
                }
                className="btn-aaa btn-primary flex-1"
              >
                <Volume2 size={20} aria-hidden="true" />
                <span>Écouter l&apos;aperçu</span>
              </button>
              <button
                type="button"
                onClick={handleResetClick}
                className="btn-aaa btn-secondary"
              >
                <RotateCcw size={18} aria-hidden="true" />
                <span>Réinitialiser</span>
              </button>
            </div>

            {confirmReset && (
              <div
                className="p-3.5 rounded-[12px] surface-box space-y-2.5"
                role="region"
                aria-label="Confirmer la réinitialisation"
              >
                <p className="hub-sm font-bold">Remettre tous les réglages par défaut ?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetPassport();
                      setConfirmReset(false);
                    }}
                    className="btn-aaa btn-primary hub-sm flex-1"
                  >
                    Oui, réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="btn-aaa btn-secondary hub-sm flex-1"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Carte Export / Import / Sync Zero-Knowledge */}
        <article className="card-box p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <p className="hub-sm font-bold text-muted">Sync &amp; Sauvegarde · Zero-Knowledge</p>
            <h2 className="hub-h2 font-bold">Transférer ou sauvegarder mon Passeport</h2>
            <p className="hub-sm text-muted">
              Scannez ce QR Code compact, copiez votre lien ou exportez un fichier local sans jamais
              créer de compte.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div
              className="qr-wrapper shrink-0"
              aria-label="QR Code de synchronisation de votre Passeport Alphabette"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code contenant votre Passeport Alphabette"
                  width={156}
                  height={156}
                  className="block w-[156px] h-[156px]"
                />
              ) : (
                <div className="w-[156px] h-[156px] flex items-center justify-center text-[12px] text-black font-bold text-center p-2">
                  Génération du QR Code...
                </div>
              )}
            </div>

            <div className="w-full space-y-2.5 min-w-0">
              <button
                type="button"
                onClick={() =>
                  onCopyText(syncUrl, 'Lien Passeport copié ! Ouvrez-le sur un autre appareil.')
                }
                className="btn-aaa btn-primary w-full"
              >
                <Copy size={18} aria-hidden="true" />
                <span>Copier mon lien Passeport</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="btn-aaa btn-secondary hub-sm"
                >
                  <Download size={16} aria-hidden="true" />
                  <span>Exporter JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-aaa btn-secondary hub-sm"
                >
                  <Upload size={16} aria-hidden="true" />
                  <span>Importer JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleUploadJson}
                  className="sr-only"
                  aria-label="Importer un fichier JSON de Passeport Alphabette"
                />
              </div>

              <div
                className="text-[11.5px] text-muted break-all p-2.5 rounded-[10px] surface-box hub-mono"
                aria-label="Aperçu du lien de synchronisation"
              >
                {syncUrl}
              </div>
            </div>
          </div>

          {/* Import rapide par collage de lien */}
          <div
            className="pt-3 border-t space-y-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <label htmlFor="passport-import-input" className="block hub-sm font-bold">
              Importer un lien ou code Passeport reçu
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="passport-import-input"
                type="text"
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Collez un lien ?passport=... ici"
                className="input-aaa flex-1 px-3 py-2 !text-[14px]"
              />
              <button
                type="button"
                onClick={handleImportText}
                className="btn-aaa btn-secondary hub-sm shrink-0"
              >
                <Import size={17} aria-hidden="true" />
                <span>Appliquer</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};
