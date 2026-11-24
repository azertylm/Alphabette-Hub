import type {
  EcosystemApp,
  PassportPreset,
  PassportSettings,
  ProductIdea,
} from '../types';

export const STORAGE_KEYS = {
  PASSPORT: 'alphabette_passport_v1',
  IDEAS: 'alphabette_ideas_v1',
  VOTES: 'alphabette_votes_v1',
  AI_MODE: 'alphabette_ai_mode_v1',
  FAVORITE_APPS: 'alphabette_favorite_apps_v1',
  PINNED_HUB: 'alphabette_pinned_hub_v1',
  SIMPLE_MODE: 'alphabette_simple_mode_v1',
  LANGUAGE: 'alphabette_lang_v1',
} as const;

export const DEFAULT_PASSPORT: PassportSettings = {
  version: 2,
  theme: 'light',
  accentColor: 'blue',
  colorBlindFilter: 'none',
  warmth: 0,
  fontSize: 'normal',
  fontFamily: 'standard',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  readingWidth: 'normal',
  underlineLinks: false,
  readingGuide: false,
  buttonSize: 'normal',
  focusStyle: 'standard',
  reducedMotion: false,
  largeCursor: false,
  confirmActions: true,
  speechRate: 1,
  speechPitch: 1,
  voiceName: '',
  autoRead: false,
  speakToasts: false,
};

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Réglages équilibrés WCAG AAA par défaut.',
    settings: { ...DEFAULT_PASSPORT },
  },
  {
    id: 'senior',
    label: 'Senior / Basse Vision',
    description: 'Texte très grand, boutons XL, liens soulignés, voix lente.',
    settings: {
      theme: 'light',
      accentColor: 'blue',
      fontSize: 'xl',
      fontFamily: 'standard',
      lineHeight: 'relaxed',
      letterSpacing: 'wide',
      underlineLinks: true,
      buttonSize: 'xl',
      focusStyle: 'strong',
      reducedMotion: true,
      largeCursor: true,
      confirmActions: true,
      speechRate: 0.8,
      speechPitch: 1,
      speakToasts: true,
    },
  },
  {
    id: 'dys',
    label: 'Confort Dys / Lecture',
    description: 'Papier Sépia anti-éblouissement, police aérée, règle de lecture.',
    settings: {
      theme: 'sepia',
      accentColor: 'emerald',
      fontSize: 'lg',
      fontFamily: 'dyslexic',
      lineHeight: 'double',
      letterSpacing: 'extra',
      readingWidth: 'narrow',
      underlineLinks: true,
      readingGuide: true,
      reducedMotion: true,
      speechRate: 0.8,
    },
  },
  {
    id: 'calm',
    label: 'Zéro Distraction / Nuit',
    description: 'Sombre Onyx, teinte chaude, sans animations ni secousses.',
    settings: {
      theme: 'onyx',
      accentColor: 'amber',
      warmth: 1,
      fontSize: 'lg',
      lineHeight: 'relaxed',
      readingWidth: 'narrow',
      reducedMotion: true,
      focusStyle: 'strong',
    },
  },
];

export const DEFAULT_IDEAS: ProductIdea[] = [
  {
    id: 'idea-1',
    name: 'MédiNotice Vocale',
    problem:
      'Les notices de médicaments sont imprimées en caractères minuscules et difficiles à comprendre.',
    target: 'Seniors, personnes malvoyantes et aidants familiaux',
    features: [
      'Scan rapide du code-barres de la boîte de médicament',
      'Résumé clair : posologie, précautions et effets majeurs',
      'Lecture vocale à vitesse réglable sans connexion requise',
    ],
    votes: 42,
    createdAt: 1732000000000 - 86400000 * 5,
  },
  {
    id: 'idea-2',
    name: 'BusClair Direct',
    problem:
      "Les horaires de bus en temps réel sont souvent surchargés d'informations et peu lisibles en plein soleil.",
    target: 'Usagers des transports en commun et seniors',
    features: [
      "Affichage géant des 2 prochains passages à l'arrêt favori",
      'Mode Contraste Maximum automatique en extérieur',
      "Alerte vocale 5 minutes avant l'arrivée du bus",
    ],
    votes: 31,
    createdAt: 1732000000000 - 86400000 * 3,
  },
  {
    id: 'idea-3',
    name: 'CourrierSimple',
    problem:
      'Les courriers administratifs utilisent un jargon complexe qui génère du stress.',
    target: 'Tout public souhaitant comprendre ses droits rapidement',
    features: [
      'Reformulation en français clair et bienveillant',
      "Extraction automatique de la date limite et de l'action à faire",
      'Traitement respectueux sans conservation des documents',
    ],
    votes: 27,
    createdAt: 1732000000000 - 86400000 * 2,
  },
  {
    id: 'idea-4',
    name: 'MarchéLocal Voix',
    problem:
      'Difficile de connaître les producteurs présents au marché du matin sans naviguer sur des réseaux sociaux.',
    target: 'Habitants de communes rurales et urbaines',
    features: [
      "Liste épurée des stands ouverts aujourd'hui",
      'Filtre rapide par besoin (fruits, fromage, pain, bio)',
      'Partage facile entre voisins par simple lien',
    ],
    votes: 19,
    createdAt: 1732000000000 - 86400000 * 1,
  },
];

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: 'infoperso',
    name: 'InfoPerso',
    category: 'Quotidien',
    url: 'https://alphabette.eu/apps/infoperso',
    shortDesc: 'Coffre-fort local de vos démarches et numéros utiles.',
    description:
      'Coffre-fort 100% local de vos démarches, numéros utiles et mémos essentiels, sans aucun cloud.',
    iconKey: 'lock',
  },
  {
    id: 'iadebat',
    name: 'IADébat',
    category: 'Culture',
    url: 'https://alphabette.eu/apps/iadebat',
    shortDesc: 'Comprendre et débattre avec des points de vue sourcés.',
    description:
      "Comprendre et débattre des grands sujets d'actualité avec plusieurs points de vue nuancés et sourcés.",
    isNew: true,
    iconKey: 'message',
  },
  {
    id: 'proxilien',
    name: 'ProxiLien',
    category: 'Entraide',
    url: 'https://alphabette.eu/apps/proxilien',
    shortDesc: 'Petits services et entraide de voisinage sans pub.',
    description:
      "Petits services, prêts d'outils et entraide de voisinage directe, sans publicité ni intermédiaire.",
    iconKey: 'users',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    category: 'Fun',
    url: 'https://alphabette.eu/apps/orbit',
    shortDesc: 'Jeux calmes de logique, mots et mémoire sans chrono.',
    description:
      'Jeux calmes de logique, mots et mémoire sans chronomètre stressant, adaptés à toutes les vues.',
    isNew: true,
    iconKey: 'smile',
  },
  {
    id: 'franceservice',
    name: 'France Service Guide',
    category: 'Quotidien',
    url: 'https://alphabette.eu/apps/france-service',
    shortDesc: 'Assistant pas-à-pas pour vos démarches administratives.',
    description:
      'Assistant pas-à-pas pour préparer vos démarches administratives (retraite, santé, impôts) sereinement.',
    iconKey: 'file',
  },
  {
    id: 'medinotice',
    name: 'MédiNotice',
    category: 'Quotidien',
    url: 'https://alphabette.eu/apps/medinotice',
    shortDesc: 'Lecteur vocal simplifié de notices de santé.',
    description:
      "Lecteur simplifié et vocal de notices de santé : retrouvez l'essentiel sans loupe.",
    isNew: true,
    iconKey: 'heart',
  },
  {
    id: 'culturelibre',
    name: 'CultureLibre',
    category: 'Culture',
    url: 'https://alphabette.eu/apps/culturelibre',
    shortDesc: 'Visites commentées et récits audio du patrimoine local.',
    description:
      'Découvertes audio, visites de musées commentées et récits du patrimoine local accessibles à tous.',
    iconKey: 'book',
  },
];

export const LANGUAGES = [
  { code: 'FR', label: 'Français (Actif)', available: true },
  { code: 'EN', label: 'English (Bientôt)', available: false },
  { code: 'ES', label: 'Español (Bientôt)', available: false },
  { code: 'DE', label: 'Deutsch (Bientôt)', available: false },
];
