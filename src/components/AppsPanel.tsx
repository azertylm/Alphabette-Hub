import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Heart,
  Lock,
  MessageSquare,
  Smile,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { ECOSYSTEM_APPS } from '../data/ecosystem';
import type { AppCategory, EcosystemApp, PassportSettings } from '../types';
import { buildAppPassportUrl } from '../utils/hubLogic';

interface AppsPanelProps {
  passport: PassportSettings;
  onSpeakText: (text: string) => void;
  onCopyText: (text: string, message: string) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const CATEGORIES: AppCategory[] = ['Toutes', 'Quotidien', 'Culture', 'Entraide', 'Fun'];

function renderAppIcon(iconKey: EcosystemApp['iconKey']) {
  const props = { size: 24, strokeWidth: 2, 'aria-hidden': true as const };
  switch (iconKey) {
    case 'lock':
      return <Lock {...props} />;
    case 'message':
      return <MessageSquare {...props} />;
    case 'users':
      return <Users {...props} />;
    case 'smile':
      return <Smile {...props} />;
    case 'file':
      return <FileText {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'book':
      return <BookOpen {...props} />;
  }
}

export const AppsPanel: React.FC<AppsPanelProps> = ({
  passport,
  onSpeakText,
  onCopyText,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('Toutes');
  const [launchedApp, setLaunchedApp] = useState<{ name: string; url: string } | null>(null);

  const filteredApps =
    selectedCategory === 'Toutes'
      ? ECOSYSTEM_APPS
      : ECOSYSTEM_APPS.filter((a) => a.category === selectedCategory);

  const handleOpenApp = (app: EcosystemApp) => {
    const url = buildAppPassportUrl(app.url, passport);
    setLaunchedApp({ name: app.name, url });
    onNotify(`Lien Passeport généré pour ${app.name} !`, 'success');
  };

  return (
    <section
      id="panel-apps"
      role="tabpanel"
      aria-labelledby="tab-apps"
      className="space-y-6"
    >
      <div className="space-y-2">
        <p className="hub-sm font-bold text-muted">Continuité automatique du Passeport</p>
        <h1 className="hub-h1 font-bold">Les Applis Alphabette</h1>
        <p className="text-muted max-w-3xl">
          Chaque application s&apos;ouvre avec vos préférences de texte, de contraste et de voix
          déjà réglées dans son lien.
        </p>
      </div>

      {/* Bannière de lancement / Aperçu du lien généré */}
      {launchedApp && (
        <div
          className="card-box p-4 sm:p-5 space-y-3"
          role="region"
          aria-live="polite"
          aria-label="Aperçu du lancement d'application"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="hub-sm font-bold text-muted">Passeport prêt à être transmis</p>
              <h2 className="hub-h2 font-bold">Ouverture de {launchedApp.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => setLaunchedApp(null)}
              aria-label="Fermer l'aperçu de lancement"
              className="btn-aaa btn-secondary !min-h-[42px] !min-w-[42px] !p-2"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <p className="hub-sm text-muted">
            URL générée automatiquement avec vos préférences actuelles :
          </p>

          <div
            className="p-3 rounded-[10px] surface-box hub-mono text-[12.5px] break-all"
            data-testid="launch-app-url"
          >
            {launchedApp.url}
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={launchedApp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-aaa btn-primary flex-1 sm:flex-none"
            >
              <ExternalLink size={18} aria-hidden="true" />
              <span>Lancer l&apos;application maintenant</span>
            </a>
            <button
              type="button"
              onClick={() =>
                onCopyText(launchedApp.url, "Lien d'application avec Passeport copié !")
              }
              className="btn-aaa btn-secondary"
            >
              <Copy size={18} aria-hidden="true" />
              <span>Copier le lien</span>
            </button>
          </div>
        </div>
      )}

      {/* Filtres par besoin */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les applications par besoin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
            className="btn-aaa btn-option hub-sm"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grille responsive d'applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="apps-grid">
        {filteredApps.map((app) => (
          <article
            key={app.id}
            className="card-box p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-soft-text)',
                      border: 'var(--border-width) solid var(--border-color)',
                    }}
                    aria-hidden="true"
                  >
                    {renderAppIcon(app.iconKey)}
                  </div>
                  <div>
                    <h2 className="hub-h2 font-bold leading-tight">{app.name}</h2>
                    <p className="hub-sm text-muted">
                      {app.category}
                      {app.isNew ? ' · Nouveauté' : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSpeakText(`${app.name}, catégorie ${app.category}. ${app.description}`)
                  }
                  aria-label={`Écouter la présentation de ${app.name}`}
                  className="btn-aaa btn-secondary hub-sm shrink-0"
                >
                  <Volume2 size={18} aria-hidden="true" />
                </button>
              </div>

              <p className="text-muted">{app.description}</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenApp(app)}
                className="btn-aaa btn-primary w-full"
              >
                <span>Ouvrir {app.name}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
