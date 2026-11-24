import { DEFAULT_PASSPORT, ECOSYSTEM_APPS } from '../data/ecosystem';
import type {
  PassportAccentColor,
  PassportButtonSize,
  PassportColorBlindFilter,
  PassportFocusStyle,
  PassportFontFamily,
  PassportFontSize,
  PassportLetterSpacing,
  PassportLineHeight,
  PassportReadingWidth,
  PassportSettings,
  PassportTheme,
  PassportWarmth,
  ProductIdea,
  ProductSheetDraft,
  SpeechPitch,
  SpeechRate,
} from '../types';

export function encodeBase64Unicode(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Unicode<T = unknown>(str: string): T {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

const VALID_THEMES: PassportTheme[] = [
  'light',
  'sepia',
  'onyx',
  'high-contrast',
  'high-contrast-light',
];
const VALID_ACCENTS: PassportAccentColor[] = ['blue', 'emerald', 'violet', 'amber'];
const VALID_COLOR_BLIND: PassportColorBlindFilter[] = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'grayscale',
];
const VALID_WARMTH: PassportWarmth[] = [0, 1, 2];
const VALID_FONT_SIZES: PassportFontSize[] = ['normal', 'lg', 'xl', 'xxl'];
const VALID_FONT_FAMILIES: PassportFontFamily[] = ['standard', 'dyslexic', 'serif', 'mono'];
const VALID_LINE_HEIGHTS: PassportLineHeight[] = ['compact', 'normal', 'relaxed', 'double'];
const VALID_LETTER_SPACINGS: PassportLetterSpacing[] = ['normal', 'wide', 'extra'];
const VALID_READING_WIDTHS: PassportReadingWidth[] = ['narrow', 'normal', 'wide'];
const VALID_BUTTON_SIZES: PassportButtonSize[] = ['normal', 'large', 'xl'];
const VALID_FOCUS_STYLES: PassportFocusStyle[] = ['standard', 'strong'];
const VALID_RATES: SpeechRate[] = [0.65, 0.8, 1, 1.25, 1.5];
const VALID_PITCHES: SpeechPitch[] = [0.8, 1, 1.2];

export function sanitizePassport(raw: unknown): PassportSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PASSPORT };
  }
  const obj = raw as Record<string, unknown>;
  const rateNum = Number(obj.speechRate) as SpeechRate;
  const pitchNum = Number(obj.speechPitch) as SpeechPitch;
  const warmthNum = Number(obj.warmth) as PassportWarmth;

  return {
    version: 2,
    theme: VALID_THEMES.includes(obj.theme as PassportTheme)
      ? (obj.theme as PassportTheme)
      : DEFAULT_PASSPORT.theme,
    accentColor: VALID_ACCENTS.includes(obj.accentColor as PassportAccentColor)
      ? (obj.accentColor as PassportAccentColor)
      : DEFAULT_PASSPORT.accentColor,
    colorBlindFilter: VALID_COLOR_BLIND.includes(obj.colorBlindFilter as PassportColorBlindFilter)
      ? (obj.colorBlindFilter as PassportColorBlindFilter)
      : DEFAULT_PASSPORT.colorBlindFilter,
    warmth: VALID_WARMTH.includes(warmthNum) ? warmthNum : DEFAULT_PASSPORT.warmth,
    fontSize: VALID_FONT_SIZES.includes(obj.fontSize as PassportFontSize)
      ? (obj.fontSize as PassportFontSize)
      : DEFAULT_PASSPORT.fontSize,
    fontFamily: VALID_FONT_FAMILIES.includes(obj.fontFamily as PassportFontFamily)
      ? (obj.fontFamily as PassportFontFamily)
      : DEFAULT_PASSPORT.fontFamily,
    lineHeight: VALID_LINE_HEIGHTS.includes(obj.lineHeight as PassportLineHeight)
      ? (obj.lineHeight as PassportLineHeight)
      : DEFAULT_PASSPORT.lineHeight,
    letterSpacing: VALID_LETTER_SPACINGS.includes(obj.letterSpacing as PassportLetterSpacing)
      ? (obj.letterSpacing as PassportLetterSpacing)
      : DEFAULT_PASSPORT.letterSpacing,
    readingWidth: VALID_READING_WIDTHS.includes(obj.readingWidth as PassportReadingWidth)
      ? (obj.readingWidth as PassportReadingWidth)
      : DEFAULT_PASSPORT.readingWidth,
    underlineLinks:
      typeof obj.underlineLinks === 'boolean'
        ? obj.underlineLinks
        : DEFAULT_PASSPORT.underlineLinks,
    readingGuide:
      typeof obj.readingGuide === 'boolean' ? obj.readingGuide : DEFAULT_PASSPORT.readingGuide,
    buttonSize: VALID_BUTTON_SIZES.includes(obj.buttonSize as PassportButtonSize)
      ? (obj.buttonSize as PassportButtonSize)
      : DEFAULT_PASSPORT.buttonSize,
    focusStyle: VALID_FOCUS_STYLES.includes(obj.focusStyle as PassportFocusStyle)
      ? (obj.focusStyle as PassportFocusStyle)
      : DEFAULT_PASSPORT.focusStyle,
    reducedMotion:
      typeof obj.reducedMotion === 'boolean'
        ? obj.reducedMotion
        : DEFAULT_PASSPORT.reducedMotion,
    largeCursor:
      typeof obj.largeCursor === 'boolean' ? obj.largeCursor : DEFAULT_PASSPORT.largeCursor,
    confirmActions:
      typeof obj.confirmActions === 'boolean'
        ? obj.confirmActions
        : DEFAULT_PASSPORT.confirmActions,
    speechRate: VALID_RATES.includes(rateNum) ? rateNum : DEFAULT_PASSPORT.speechRate,
    speechPitch: VALID_PITCHES.includes(pitchNum) ? pitchNum : DEFAULT_PASSPORT.speechPitch,
    voiceName: typeof obj.voiceName === 'string' ? obj.voiceName.slice(0, 120) : '',
    autoRead: typeof obj.autoRead === 'boolean' ? obj.autoRead : Boolean(obj.autoRead),
    speakToasts:
      typeof obj.speakToasts === 'boolean' ? obj.speakToasts : DEFAULT_PASSPORT.speakToasts,
  };
}

/**
 * Compact diff-encoding for QR Code scannability: omits fields that match DEFAULT_PASSPORT.
 * Decoding via sanitizePassport() seamlessly restores omitted defaults.
 */
export function encodePassportForSync(passport: PassportSettings): string {
  const diff: Record<string, unknown> = { version: 2 };
  (Object.keys(DEFAULT_PASSPORT) as (keyof PassportSettings)[]).forEach((key) => {
    if (key === 'version') return;
    if (passport[key] !== DEFAULT_PASSPORT[key]) {
      diff[key] = passport[key];
    }
  });
  return encodeBase64Unicode(diff);
}

export function buildPassportSyncUrl(passport: PassportSettings, baseOriginPath?: string): string {
  const encoded = encodePassportForSync(passport);
  const base =
    baseOriginPath && baseOriginPath !== 'null'
      ? baseOriginPath
      : 'https://alphabette.eu/hub';
  return `${base}?passport=${encoded}`;
}

/**
 * Accepts a full sync URL (?passport=...), a raw Base64URL token, or a raw JSON backup.
 */
export function parseImportedPassportInput(input: string): PassportSettings {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Collez un lien Passeport ou un fichier JSON valide.');
  }

  // 1. Raw JSON
  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    return sanitizePassport(parsed);
  }

  // 2. Full URL with ?passport=...
  if (trimmed.includes('passport=')) {
    const match = trimmed.match(/[?&]passport=([^&#\s]+)/);
    if (!match || !match[1]) {
      throw new Error('Paramètre passport introuvable dans ce lien.');
    }
    const decoded = decodeBase64Unicode(decodeURIComponent(match[1]));
    return sanitizePassport(decoded);
  }

  // 3. Raw Base64URL token
  const decoded = decodeBase64Unicode(trimmed);
  return sanitizePassport(decoded);
}

export function countActiveCustomizations(passport: PassportSettings): number {
  let count = 0;
  (Object.keys(DEFAULT_PASSPORT) as (keyof PassportSettings)[]).forEach((key) => {
    if (key === 'version') return;
    if (passport[key] !== DEFAULT_PASSPORT[key]) {
      count += 1;
    }
  });
  return count;
}

export function buildAppPassportUrl(baseUrl: string, passport: PassportSettings): string {
  const params = new URLSearchParams({
    theme: passport.theme,
    font: passport.fontSize,
    dys: passport.fontFamily === 'dyslexic' ? '1' : '0',
    tts: passport.autoRead ? 'auto' : 'manual',
    rate: String(passport.speechRate),
  });

  if (passport.accentColor !== DEFAULT_PASSPORT.accentColor) {
    params.set('accent', passport.accentColor);
  }
  if (passport.fontFamily !== 'standard' && passport.fontFamily !== 'dyslexic') {
    params.set('family', passport.fontFamily);
  }
  if (passport.lineHeight !== DEFAULT_PASSPORT.lineHeight) {
    params.set('lh', passport.lineHeight);
  }
  if (passport.letterSpacing !== DEFAULT_PASSPORT.letterSpacing) {
    params.set('ls', passport.letterSpacing);
  }
  if (passport.readingWidth !== DEFAULT_PASSPORT.readingWidth) {
    params.set('rw', passport.readingWidth);
  }
  if (passport.buttonSize !== DEFAULT_PASSPORT.buttonSize) {
    params.set('btn', passport.buttonSize);
  }
  if (passport.focusStyle !== DEFAULT_PASSPORT.focusStyle) {
    params.set('focus', passport.focusStyle);
  }
  if (passport.colorBlindFilter !== 'none') {
    params.set('cb', passport.colorBlindFilter);
  }
  if (passport.warmth > 0) {
    params.set('warm', String(passport.warmth));
  }
  if (passport.reducedMotion) {
    params.set('motion', 'reduce');
  }
  if (passport.underlineLinks) {
    params.set('links', '1');
  }
  if (passport.readingGuide) {
    params.set('guide', '1');
  }
  if (passport.speechPitch !== 1) {
    params.set('pitch', String(passport.speechPitch));
  }

  return `${baseUrl}?${params.toString()}`;
}

export function demoGenerateProductSheet(rawText: string): ProductSheetDraft {
  const clean = rawText.trim();
  const t = clean.toLowerCase();

  if (
    t.includes('médicament') ||
    t.includes('medicament') ||
    t.includes('notice') ||
    t.includes('santé') ||
    t.includes('sante') ||
    t.includes('ordonnance')
  ) {
    return {
      name: 'SantéClair Vocal',
      problem: clean,
      target: 'Seniors, patients chroniques et aidants',
      features: [
        'Lecture photo instantanée des notices et ordonnances en gros caractères',
        'Synthèse vocale calme expliquant la posologie sans jargon médical',
        'Rappels locaux de prise de traitement sans compte ni partage de données',
      ],
    };
  }

  if (
    t.includes('bus') ||
    t.includes('train') ||
    t.includes('transport') ||
    t.includes('trajet') ||
    t.includes('métro') ||
    t.includes('metro')
  ) {
    return {
      name: 'TrajetSerein',
      problem: clean,
      target: 'Voyageurs quotidiens et personnes à mobilité réduite',
      features: [
        'Affichage épuré des prochains départs en contraste maximum',
        "Guidage vocal étape par étape jusqu'à la destination",
        'Signalement simple des ascenseurs ou accès disponibles',
      ],
    };
  }

  if (
    t.includes('impôt') ||
    t.includes('impot') ||
    t.includes('papier') ||
    t.includes('courrier') ||
    t.includes('administratif') ||
    t.includes('caf')
  ) {
    return {
      name: 'DémarcheFacile',
      problem: clean,
      target: 'Citoyens souhaitant simplifier leurs démarches administratives',
      features: [
        'Traduction automatique du jargon administratif en français simple',
        'Liste de contrôle interactive des justificatifs à préparer',
        "Sauvegarde 100% locale sur l'appareil pour protéger la vie privée",
      ],
    };
  }

  const snippet = clean.slice(0, 140);
  return {
    name: 'Alphabette Compagnon',
    problem: snippet,
    target: 'Grand public et utilisateurs recherchant une interface accessible',
    features: [
      'Interface épurée compatible avec le Passeport Alphabette (WCAG AAA)',
      'Assistance vocale intégrée pour dicter et écouter chaque étape',
      'Fonctionnement 100% sans compte et respectueux de la vie privée',
    ],
  };
}

export function demoGenerateBugTicket(
  rawText: string,
  passport: PassportSettings,
  viewport = '1440x900px'
): string {
  const clean = rawText.trim();
  const lower = clean.toLowerCase();
  const detectedApp =
    ECOSYSTEM_APPS.find((a) => lower.includes(a.name.toLowerCase()))?.name ||
    'Alphabette Hub';
  const isHigh =
    lower.includes('bloque') ||
    lower.includes('plant') ||
    lower.includes('impossible') ||
    lower.includes('répond pas') ||
    lower.includes('repond pas');
  const severity = isHigh ? 'Élevée (Bloquant)' : "Moyenne (Gêne d'usage)";

  return [
    '=== TICKET TECHNIQUE ALPHABETTE ===',
    `Appli concernée : ${detectedApp}`,
    `Gravité estimée : ${severity}`,
    '',
    'Description & Étapes de reproduction :',
    `1. Ouvrir ${detectedApp} avec le Passeport actif.`,
    `2. Reproduire l'action décrite : "${clean}"`,
    '3. Constater le dysfonctionnement signalé.',
    '',
    'Contexte Passeport (Zero-Knowledge) :',
    `- Thème : ${passport.theme} (accent: ${passport.accentColor}, daltonisme: ${passport.colorBlindFilter})`,
    `- Texte : ${passport.fontSize}, police: ${passport.fontFamily}, interligne: ${passport.lineHeight}, espacement: ${passport.letterSpacing}`,
    `- Confort : boutons ${passport.buttonSize}, focus ${passport.focusStyle}, animations réduites: ${passport.reducedMotion ? 'oui' : 'non'}`,
    `- Voix : vitesse ${passport.speechRate}x, hauteur ${passport.speechPitch}x`,
    `- Écran : ${viewport}`,
  ].join('\n');
}

export function sortIdeas(
  ideas: ProductIdea[],
  mode: 'votes' | 'recent'
): ProductIdea[] {
  return [...ideas].sort((a, b) => {
    if (mode === 'recent') {
      return b.createdAt - a.createdAt;
    }
    return b.votes - a.votes || b.createdAt - a.createdAt;
  });
}

export function toggleIdeaVote(
  ideas: ProductIdea[],
  userVotes: string[],
  ideaId: string
): { ideas: ProductIdea[]; userVotes: string[]; added: boolean; targetName: string | null } {
  const target = ideas.find((i) => i.id === ideaId);
  if (!target) {
    return { ideas, userVotes, added: false, targetName: null };
  }

  const alreadyVoted = userVotes.includes(ideaId);
  const nextVotes = alreadyVoted
    ? userVotes.filter((id) => id !== ideaId)
    : [...userVotes, ideaId];

  const nextIdeas = ideas.map((idea) => {
    if (idea.id !== ideaId) return idea;
    return {
      ...idea,
      votes: alreadyVoted ? Math.max(0, idea.votes - 1) : idea.votes + 1,
    };
  });

  return {
    ideas: nextIdeas,
    userVotes: nextVotes,
    added: !alreadyVoted,
    targetName: target.name,
  };
}
