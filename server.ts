import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

app.post('/api/ai/product-sheet', async (req, res) => {
  const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText.trim() : '';
  if (!rawText) {
    res.status(400).json({ error: 'Veuillez saisir ou dicter une idée avant de la transformer.' });
    return;
  }
  if (rawText.length > 2000) {
    res.status(400).json({ error: 'Le texte dépasse la limite de 2000 caractères.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Le moteur IA serveur n’est pas configuré sur cet environnement. Basculez en Mode Local (hors-ligne).',
      code: 'AI_NOT_CONFIGURED',
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Tu es un architecte produit expert en accessibilité numérique (WCAG AAA) pour l'écosystème Alphabette (applications simples, sans compte, sans cookie, respectueuses de la vie privée). Transforme cette idée utilisateur en une fiche produit concise et concrète en français.\n\nIdée utilisateur : "${rawText}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Nom court et mémorable pour l’application (2 à 3 mots max).',
            },
            problem: {
              type: Type.STRING,
              description: 'Reformulation claire du problème du quotidien résolu (1 à 2 phrases).',
            },
            target: {
              type: Type.STRING,
              description: 'Public cible principal (ex: Seniors, aidants, usagers quotidiens).',
            },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactement 3 fonctionnalités clés simples et accessibles.',
            },
          },
          required: ['name', 'problem', 'target', 'features'],
        },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      res.status(502).json({ error: 'Réponse vide du moteur IA.' });
      return;
    }

    const parsed = JSON.parse(text);
    res.json({
      name: String(parsed.name || 'Nouvelle Idée'),
      problem: String(parsed.problem || rawText),
      target: String(parsed.target || 'Tout public'),
      features: Array.isArray(parsed.features)
        ? parsed.features.map((f: unknown) => String(f)).slice(0, 5)
        : ['Interface accessible WCAG AAA'],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la génération IA.';
    res.status(502).json({ error: message });
  }
});

app.post('/api/ai/bug-ticket', async (req, res) => {
  const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText.trim() : '';
  const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};

  if (!rawText) {
    res.status(400).json({ error: 'Veuillez décrire ou dicter le souci rencontré.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Le moteur IA serveur n’est pas configuré sur cet environnement. Basculez en Mode Local (hors-ligne).',
      code: 'AI_NOT_CONFIGURED',
    });
    return;
  }

  const contextSummary = `Thème=${String(context.theme || 'light')}, Taille=${String(context.fontSize || 'normal')}, Police=${String(context.fontFamily || 'standard')}, VitesseVoix=${String(context.speechRate || 1)}x, Écran=${String(context.viewport || 'inconnu')}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Formate un ticket technique structuré, clair et concis en français (texte brut sans markdown gras) avec les sections : === TICKET TECHNIQUE ALPHABETTE ===, Appli concernée, Gravité estimée, Description & Étapes de reproduction, et Contexte Passeport (Zero-Knowledge).\n\nSignalement utilisateur : "${rawText}"\nContexte technique : ${contextSummary}`,
    });

    const ticket = (response.text ?? '').trim();
    if (!ticket) {
      res.status(502).json({ error: 'Réponse vide du moteur IA.' });
      return;
    }

    res.json({ ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors du formatage du ticket.';
    res.status(502).json({ error: message });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Alphabette Hub listening on http://localhost:${PORT}`);
  });
}

startServer();
