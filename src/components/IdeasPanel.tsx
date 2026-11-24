import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Flame,
  Clock,
  Mail,
  Mic,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import type { AiEngineMode, PassportSettings, ProductIdea } from '../types';
import {
  demoGenerateBugTicket,
  demoGenerateProductSheet,
  sortIdeas,
} from '../utils/hubLogic';

interface IdeasPanelProps {
  ideas: ProductIdea[];
  userVotes: string[];
  passport: PassportSettings;
  aiMode: AiEngineMode;
  onChangeAiMode: (mode: AiEngineMode) => void;
  onPublishIdea: (draft: {
    name: string;
    target: string;
    problem: string;
    features: string[];
  }) => void;
  onToggleVote: (ideaId: string) => void;
  onSpeakText: (text: string) => void;
  onCopyText: (text: string, message: string) => void;
  onNotify: (message: string, type?: 'info' | 'success' | 'error') => void;
}

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

export const IdeasPanel: React.FC<IdeasPanelProps> = ({
  ideas,
  userVotes,
  passport,
  aiMode,
  onChangeAiMode,
  onPublishIdea,
  onToggleVote,
  onSpeakText,
  onCopyText,
  onNotify,
}) => {
  const [ideaInput, setIdeaInput] = useState('');
  const [isListeningIdea, setIsListeningIdea] = useState(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [showDraft, setShowDraft] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftProblem, setDraftProblem] = useState('');
  const [draftFeatures, setDraftFeatures] = useState('');

  const [sortMode, setSortMode] = useState<'votes' | 'recent'>('votes');

  // Modale signalement de bug
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugInput, setBugInput] = useState('');
  const [isListeningBug, setIsListeningBug] = useState(false);
  const [isGeneratingBug, setIsGeneratingBug] = useState(false);
  const [bugTicket, setBugTicket] = useState('');
  const [bugError, setBugError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bugModalOpen) {
        setBugModalOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [bugModalOpen]);

  const startVoiceDictation = (
    onResult: (transcript: string) => void,
    setListening: (v: boolean) => void
  ) => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      onNotify(
        'La dictée vocale nécessite Chrome, Edge ou Safari récent. Vous pouvez écrire au clavier.',
        'error'
      );
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onResult(transcript);
        onNotify('Dictée vocale ajoutée !', 'success');
      }
    };

    recognition.onerror = () => {
      onNotify('Micro non détecté ou autorisation refusée.', 'error');
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const handleGenerateIdea = async (forceLocal = false) => {
    const clean = ideaInput.trim();
    if (!clean) {
      onNotify("Dictez ou écrivez d'abord votre idée en une phrase.", 'error');
      return;
    }

    setAiError(null);
    setIsGeneratingIdea(true);

    try {
      if (aiMode === 'local' || forceLocal) {
        await new Promise((r) => setTimeout(r, 250));
        const sheet = demoGenerateProductSheet(clean);
        setDraftName(sheet.name);
        setDraftTarget(sheet.target);
        setDraftProblem(sheet.problem);
        setDraftFeatures(sheet.features.join('\n'));
        setShowDraft(true);
        onNotify("Fiche Produit générée localement ! Vous pouvez l'ajuster ou la publier.", 'success');
        return;
      }

      const res = await fetch('/api/ai/product-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur (${res.status})`);
      }

      setDraftName(data.name || 'Nouvelle Idée');
      setDraftTarget(data.target || 'Tout public');
      setDraftProblem(data.problem || clean);
      setDraftFeatures(Array.isArray(data.features) ? data.features.join('\n') : '');
      setShowDraft(true);
      onNotify("Fiche Produit générée par l'IA ! Vous pouvez l'ajuster ou la publier.", 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de génération IA.';
      setAiError(msg);
      onNotify(msg, 'error');
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handlePublish = () => {
    const name = draftName.trim();
    const problem = draftProblem.trim();
    const target = draftTarget.trim();
    const features = draftFeatures
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!name || !problem) {
      onNotify('Veuillez renseigner au moins un nom et le problème résolu.', 'error');
      return;
    }

    onPublishIdea({
      name,
      target: target || 'Tout public',
      problem,
      features: features.length ? features : ['Interface accessible WCAG AAA'],
    });

    setIdeaInput('');
    setShowDraft(false);
  };

  const handleGenerateBugTicket = async (forceLocal = false) => {
    const clean = bugInput.trim();
    if (!clean) {
      onNotify("Décrivez ou dictez d'abord le problème rencontré.", 'error');
      return;
    }

    setBugError(null);
    setIsGeneratingBug(true);
    const viewport = `${window.innerWidth}x${window.innerHeight}px`;

    try {
      if (aiMode === 'local' || forceLocal) {
        await new Promise((r) => setTimeout(r, 200));
        const ticket = demoGenerateBugTicket(clean, passport, viewport);
        setBugTicket(ticket);
        onNotify('Ticket technique formaté localement !', 'success');
        return;
      }

      const res = await fetch('/api/ai/bug-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: clean,
          context: {
            theme: passport.theme,
            accentColor: passport.accentColor,
            colorBlindFilter: passport.colorBlindFilter,
            fontSize: passport.fontSize,
            fontFamily: passport.fontFamily,
            lineHeight: passport.lineHeight,
            buttonSize: passport.buttonSize,
            reducedMotion: passport.reducedMotion,
            speechRate: passport.speechRate,
            speechPitch: passport.speechPitch,
            viewport,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur (${res.status})`);
      }

      setBugTicket(data.ticket);
      onNotify('Ticket technique formaté avec succès !', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du formatage du ticket.';
      setBugError(msg);
      onNotify(msg, 'error');
    } finally {
      setIsGeneratingBug(false);
    }
  };

  const sortedIdeas = sortIdeas(ideas, sortMode);

  return (
    <section
      id="panel-ideas"
      role="tabpanel"
      aria-labelledby="tab-ideas"
      className="space-y-6"
    >
      {/* En-tête de l'onglet */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="hub-sm font-bold text-muted">Labo communautaire · alphabette.eu</p>
          <h1 className="hub-h1 font-bold">La Boîte à Idées Vivante</h1>
          <p className="text-muted max-w-2xl">
            Dictez un souci du quotidien : l&apos;assistant produit le transforme en projet concret
            soumis au vote de la communauté.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBugError(null);
            setBugModalOpen(true);
          }}
          className="btn-aaa btn-secondary shrink-0"
        >
          <AlertTriangle size={19} aria-hidden="true" />
          <span>Signaler un bug à la voix</span>
        </button>
      </div>

      {/* Zone de soumission vocale ou texte */}
      <article className="card-box p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label htmlFor="idea-input" className="hub-h3 font-bold">
            Quel problème du quotidien aimeriez-vous simplifier ?
          </label>

          {/* Sélecteur de moteur : Local hors-ligne vs IA Gemini serveur (sans aucune saisie de clé API) */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-[12px] surface-box self-start sm:self-auto"
            role="group"
            aria-label="Moteur de transformation de fiche produit"
          >
            <button
              type="button"
              onClick={() => {
                onChangeAiMode('local');
                setAiError(null);
              }}
              aria-pressed={aiMode === 'local'}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-[8px] text-[13.5px] font-bold transition-colors cursor-pointer ${
                aiMode === 'local'
                  ? 'btn-primary !border'
                  : 'text-muted hover:opacity-80'
              }`}
            >
              Mode Local
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeAiMode('gemini');
                setAiError(null);
              }}
              aria-pressed={aiMode === 'gemini'}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-[8px] text-[13.5px] font-bold transition-colors cursor-pointer ${
                aiMode === 'gemini'
                  ? 'btn-primary !border'
                  : 'text-muted hover:opacity-80'
              }`}
            >
              IA Serveur
            </button>
          </div>
        </div>

        <textarea
          id="idea-input"
          rows={3}
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          className="input-aaa w-full p-3.5"
          placeholder="Exemple : J'ai du mal à lire les notices de médicaments écrites trop petit..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              startVoiceDictation(
                (transcript) =>
                  setIdeaInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript)),
                setIsListeningIdea
              )
            }
            className={`btn-aaa btn-secondary ${isListeningIdea ? 'mic-listening' : ''}`}
          >
            <Mic size={19} aria-hidden="true" />
            <span>{isListeningIdea ? 'Écoute en cours...' : 'Dicter mon idée'}</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingIdea}
            onClick={() => handleGenerateIdea(false)}
            className="btn-aaa btn-primary flex-1 sm:flex-none"
          >
            <Sparkles size={19} aria-hidden="true" />
            <span>
              {isGeneratingIdea ? 'Analyse en cours...' : 'Transformer en Fiche Produit'}
            </span>
          </button>
        </div>

        {/* Erreur serveur transparente avec bascule manuelle vers Mode Local */}
        {aiError && (
          <div
            className="p-3.5 rounded-[12px] surface-box flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            role="alert"
          >
            <p className="hub-sm font-bold">{aiError}</p>
            <button
              type="button"
              onClick={() => {
                onChangeAiMode('local');
                handleGenerateIdea(true);
              }}
              className="btn-aaa btn-secondary hub-sm shrink-0"
            >
              Générer en Mode Local
            </button>
          </div>
        )}

        {/* Brouillon de Fiche Produit généré */}
        {showDraft && (
          <div
            className="mt-4 p-4 sm:p-5 rounded-[14px] surface-box space-y-4"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="hub-sm font-bold text-muted">Fiche Produit générée · Modifiable</p>
              <button
                type="button"
                onClick={() =>
                  onSpeakText(
                    `Fiche produit : ${draftName}. Public cible : ${draftTarget}. Problème résolu : ${draftProblem}. Fonctionnalités clés : ${draftFeatures}`
                  )
                }
                className="btn-aaa btn-secondary hub-sm"
              >
                <Volume2 size={17} aria-hidden="true" />
                <span>Écouter la fiche</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="draft-name" className="block hub-sm font-bold mb-1">
                  Nom proposé
                </label>
                <input
                  id="draft-name"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="input-aaa w-full p-2.5 font-bold"
                />
              </div>
              <div>
                <label htmlFor="draft-target" className="block hub-sm font-bold mb-1">
                  Public cible
                </label>
                <input
                  id="draft-target"
                  type="text"
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(e.target.value)}
                  className="input-aaa w-full p-2.5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="draft-problem" className="block hub-sm font-bold mb-1">
                Problème résolu
              </label>
              <textarea
                id="draft-problem"
                rows={2}
                value={draftProblem}
                onChange={(e) => setDraftProblem(e.target.value)}
                className="input-aaa w-full p-2.5"
              />
            </div>

            <div>
              <label htmlFor="draft-features" className="block hub-sm font-bold mb-1">
                3 fonctionnalités clés (une par ligne)
              </label>
              <textarea
                id="draft-features"
                rows={3}
                value={draftFeatures}
                onChange={(e) => setDraftFeatures(e.target.value)}
                className="input-aaa w-full p-2.5"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={handlePublish}
                className="btn-aaa btn-primary flex-1"
              >
                <Check size={19} aria-hidden="true" />
                <span>Publier dans la Boîte à Idées</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDraft(false)}
                className="btn-aaa btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Liste communautaire & Votes */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="hub-h2 font-bold">
            Idées de la communauté (<span className="tabular-nums">{ideas.length}</span>)
          </h2>
          <div className="flex items-center gap-2" role="group" aria-label="Trier les idées">
            <button
              type="button"
              aria-pressed={sortMode === 'votes'}
              onClick={() => setSortMode('votes')}
              className="btn-aaa btn-option hub-sm"
            >
              <Flame size={16} aria-hidden="true" />
              <span>Plus demandées</span>
            </button>
            <button
              type="button"
              aria-pressed={sortMode === 'recent'}
              onClick={() => setSortMode('recent')}
              className="btn-aaa btn-option hub-sm"
            >
              <Clock size={16} aria-hidden="true" />
              <span>Récentes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4" data-testid="ideas-list">
          {sortedIdeas.map((idea) => {
            const hasVoted = userVotes.includes(idea.id);
            return (
              <article key={idea.id} className="card-box p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <h3 className="hub-h2 font-bold">{idea.name}</h3>
                    <p className="hub-sm text-muted">
                      <strong>Public cible :</strong> {idea.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onSpeakText(
                          `${idea.name}. Pour ${idea.target}. Problème résolu : ${idea.problem}. Fonctionnalités : ${idea.features.join('. ')}.`
                        )
                      }
                      aria-label={`Écouter la fiche ${idea.name}`}
                      className="btn-aaa btn-secondary hub-sm"
                    >
                      <Volume2 size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleVote(idea.id)}
                      aria-pressed={hasVoted}
                      aria-label={`${hasVoted ? 'Retirer mon vote pour' : 'Voter pour'} ${idea.name}, actuellement ${idea.votes} votes`}
                      className="btn-aaa btn-option tabular-nums"
                    >
                      <span aria-hidden="true">{hasVoted ? '★' : '☆'}</span>
                      <span>{idea.votes}</span>
                    </button>
                  </div>
                </div>

                <p>{idea.problem}</p>

                <ul
                  className="hub-sm text-muted space-y-1.5 pt-3 border-t"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {idea.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true">·</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modale Signalement de bug à la voix */}
      {bugModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-bug-title"
          onClick={() => setBugModalOpen(false)}
        >
          <div
            className="card-box w-full max-w-xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-bug-title" className="hub-h2 font-bold">
                Signaler un bug à la voix
              </h2>
              <button
                type="button"
                onClick={() => setBugModalOpen(false)}
                aria-label="Fermer la fenêtre de signalement de bug"
                className="btn-aaa btn-secondary !min-h-[42px] !min-w-[42px] !p-2"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="hub-sm text-muted">
              Expliquez simplement ce qui n&apos;a pas fonctionné : un ticket technique structuré
              incluant votre Passeport actif sera préparé.
            </p>

            <label htmlFor="bug-input" className="sr-only">
              Description du bug rencontré
            </label>
            <textarea
              id="bug-input"
              rows={3}
              value={bugInput}
              onChange={(e) => setBugInput(e.target.value)}
              className="input-aaa w-full p-3"
              placeholder="Exemple : Sur ProxiLien, le bouton pour envoyer un message ne répond pas quand le texte est en très grand..."
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  startVoiceDictation(
                    (transcript) =>
                      setBugInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript)),
                    setIsListeningBug
                  )
                }
                className={`btn-aaa btn-secondary ${isListeningBug ? 'mic-listening' : ''}`}
              >
                <Mic size={18} aria-hidden="true" />
                <span>{isListeningBug ? 'Écoute en cours...' : 'Dicter le souci'}</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingBug}
                onClick={() => handleGenerateBugTicket(false)}
                className="btn-aaa btn-primary flex-1"
              >
                <span>
                  {isGeneratingBug ? 'Formatage en cours...' : 'Formater le ticket technique'}
                </span>
              </button>
            </div>

            {bugError && (
              <div
                className="p-3 rounded-[10px] surface-box flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                role="alert"
              >
                <p className="hub-sm font-bold">{bugError}</p>
                <button
                  type="button"
                  onClick={() => handleGenerateBugTicket(true)}
                  className="btn-aaa btn-secondary hub-sm shrink-0"
                >
                  Formater en Mode Local
                </button>
              </div>
            )}

            {bugTicket && (
              <div
                className="space-y-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-color)' }}
                aria-live="polite"
              >
                <label htmlFor="bug-ticket-output" className="block hub-sm font-bold">
                  Ticket technique prêt à envoyer :
                </label>
                <textarea
                  id="bug-ticket-output"
                  rows={8}
                  value={bugTicket}
                  onChange={(e) => setBugTicket(e.target.value)}
                  className="input-aaa w-full p-3 hub-mono !text-[13.5px]"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onCopyText(bugTicket, 'Ticket technique copié !')}
                    className="btn-aaa btn-primary flex-1"
                  >
                    <Copy size={18} aria-hidden="true" />
                    <span>Copier le ticket</span>
                  </button>
                  <a
                    href={`mailto:support@alphabette.eu?subject=${encodeURIComponent(
                      '[Bug Alphabette] Signalement utilisateur'
                    )}&body=${encodeURIComponent(bugTicket)}`}
                    className="btn-aaa btn-secondary flex-1"
                  >
                    <Mail size={18} aria-hidden="true" />
                    <span>Envoyer par email</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
