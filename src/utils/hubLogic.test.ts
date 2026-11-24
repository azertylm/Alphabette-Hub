import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppPassportUrl,
  buildPassportSyncUrl,
  countActiveCustomizations,
  decodeBase64Unicode,
  demoGenerateBugTicket,
  demoGenerateProductSheet,
  encodeBase64Unicode,
  encodePassportForSync,
  parseImportedPassportInput,
  sanitizePassport,
  sortIdeas,
  toggleIdeaVote,
} from './hubLogic';
import { DEFAULT_IDEAS, DEFAULT_PASSPORT, PASSPORT_PRESETS } from '../data/ecosystem';

test('Base64URL unicode roundtrip preserves French accents and passport fields', () => {
  const sample = {
    version: 2,
    fontSize: 'xxl',
    theme: 'sepia',
    fontFamily: 'dyslexic',
    speechRate: 0.65,
    autoRead: true,
    note: 'Écosystème Alphabette — été',
  };
  const encoded = encodeBase64Unicode(sample);
  assert.ok(!encoded.includes('+'));
  assert.ok(!encoded.includes('/'));
  assert.ok(!encoded.includes('='));
  const decoded = decodeBase64Unicode<typeof sample>(encoded);
  assert.deepEqual(decoded, sample);
});

test('sanitizePassport upgrades v1 payloads and rejects invalid values', () => {
  const legacyV1 = {
    version: 1,
    fontSize: 'lg',
    theme: 'onyx',
    fontFamily: 'dyslexic',
    speechRate: 1.25,
    autoRead: true,
  };
  const upgraded = sanitizePassport(legacyV1);
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.theme, 'onyx');
  assert.equal(upgraded.fontSize, 'lg');
  assert.equal(upgraded.fontFamily, 'dyslexic');
  assert.equal(upgraded.accentColor, 'blue');
  assert.equal(upgraded.buttonSize, 'normal');

  const dirty = {
    fontSize: 'giant',
    theme: 'neon',
    accentColor: 'pink',
    colorBlindFilter: 'xray',
    warmth: 9,
    speechRate: 99,
    speechPitch: 5,
  };
  const clean = sanitizePassport(dirty);
  assert.deepEqual(clean, DEFAULT_PASSPORT);
});

test('encodePassportForSync uses compact diff encoding and roundtrips cleanly', () => {
  const defaultEncoded = encodePassportForSync(DEFAULT_PASSPORT);
  assert.ok(defaultEncoded.length < 30, 'default diff payload should stay tiny for QR scannability');

  const custom = {
    ...DEFAULT_PASSPORT,
    theme: 'sepia' as const,
    accentColor: 'emerald' as const,
    fontSize: 'xxl' as const,
    lineHeight: 'double' as const,
    readingGuide: true,
    buttonSize: 'xl' as const,
    speechRate: 0.65 as const,
  };
  const syncUrl = buildPassportSyncUrl(custom, 'https://alphabette.eu/hub');
  const restored = parseImportedPassportInput(syncUrl);
  assert.deepEqual(restored, custom);
});

test('parseImportedPassportInput handles full URL, raw token, and JSON backup', () => {
  const custom = { ...DEFAULT_PASSPORT, theme: 'high-contrast-light' as const, underlineLinks: true };
  const token = encodePassportForSync(custom);

  assert.deepEqual(parseImportedPassportInput(`https://alphabette.eu/hub?passport=${token}`), custom);
  assert.deepEqual(parseImportedPassportInput(token), custom);
  assert.deepEqual(parseImportedPassportInput(JSON.stringify(custom)), custom);
  assert.throws(() => parseImportedPassportInput('   '));
});

test('countActiveCustomizations and PASSPORT_PRESETS work consistently', () => {
  assert.equal(countActiveCustomizations(DEFAULT_PASSPORT), 0);
  const seniorPreset = PASSPORT_PRESETS.find((p) => p.id === 'senior');
  assert.ok(seniorPreset);
  const merged = sanitizePassport({ ...DEFAULT_PASSPORT, ...seniorPreset.settings });
  assert.ok(countActiveCustomizations(merged) >= 8);
});

test('buildAppPassportUrl encodes base and extended accessibility parameters', () => {
  const url = buildAppPassportUrl('https://alphabette.eu/apps/infoperso', {
    ...DEFAULT_PASSPORT,
    fontSize: 'xxl',
    theme: 'sepia',
    accentColor: 'emerald',
    fontFamily: 'dyslexic',
    lineHeight: 'double',
    buttonSize: 'xl',
    colorBlindFilter: 'deuteranopia',
    warmth: 2,
    reducedMotion: true,
    readingGuide: true,
    underlineLinks: true,
    speechRate: 0.8,
    speechPitch: 1.2,
    autoRead: true,
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('theme'), 'sepia');
  assert.equal(parsed.searchParams.get('font'), 'xxl');
  assert.equal(parsed.searchParams.get('accent'), 'emerald');
  assert.equal(parsed.searchParams.get('dys'), '1');
  assert.equal(parsed.searchParams.get('lh'), 'double');
  assert.equal(parsed.searchParams.get('btn'), 'xl');
  assert.equal(parsed.searchParams.get('cb'), 'deuteranopia');
  assert.equal(parsed.searchParams.get('warm'), '2');
  assert.equal(parsed.searchParams.get('motion'), 'reduce');
  assert.equal(parsed.searchParams.get('guide'), '1');
  assert.equal(parsed.searchParams.get('links'), '1');
  assert.equal(parsed.searchParams.get('pitch'), '1.2');
});

test('demoGenerateProductSheet adapts output to domain keywords', () => {
  assert.equal(demoGenerateProductSheet('Lire les notices de médicaments').name, 'SantéClair Vocal');
  assert.equal(demoGenerateProductSheet('Voir le prochain bus').name, 'TrajetSerein');
  assert.equal(demoGenerateProductSheet('Comprendre un courrier des impôts').name, 'DémarcheFacile');
  assert.equal(demoGenerateProductSheet('Retrouver mes recettes').name, 'Alphabette Compagnon');
});

test('demoGenerateBugTicket detects app, severity, and rich passport context', () => {
  const ticket = demoGenerateBugTicket(
    'Sur ProxiLien le bouton envoyer ne répond pas',
    { ...DEFAULT_PASSPORT, theme: 'high-contrast', fontSize: 'xxl', buttonSize: 'xl' },
    '390x844px'
  );
  assert.match(ticket, /Appli concernée : ProxiLien/);
  assert.match(ticket, /Gravité estimée : Élevée \(Bloquant\)/);
  assert.match(ticket, /boutons xl/);
  assert.match(ticket, /Écran : 390x844px/);
});

test('sortIdeas and toggleIdeaVote behave deterministically', () => {
  const byVotes = sortIdeas(DEFAULT_IDEAS, 'votes');
  assert.equal(byVotes[0].id, 'idea-1');
  const byRecent = sortIdeas(DEFAULT_IDEAS, 'recent');
  assert.equal(byRecent[0].id, 'idea-4');

  const first = toggleIdeaVote(DEFAULT_IDEAS, [], 'idea-2');
  assert.equal(first.added, true);
  assert.equal(first.ideas.find((i) => i.id === 'idea-2')?.votes, 32);

  const second = toggleIdeaVote(first.ideas, first.userVotes, 'idea-2');
  assert.equal(second.added, false);
  assert.equal(second.ideas.find((i) => i.id === 'idea-2')?.votes, 31);
});
