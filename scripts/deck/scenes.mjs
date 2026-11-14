import { connectLines } from '../lib/connectLines.mjs';

// What the deck demo says: the chapter labels and Polish captions, scene by scene, and its terminal and Claude Code
// lines. The talk's speaker notes follow this order.
export const CAPTIONS = {
  start: ['Start', 'Uruchom teamtrail w repozytorium. Lookout działa na Twoim komputerze.'],
  signIn: ['Zalogowano', 'Jedno kliknięcie i jesteś zalogowany.'],
  connect: ['Połączenie', 'Jedna komenda podłącza Claude Code (albo Codex) przez MCP.'],
  newTrail: ['Nowy trail', 'Opisz zadanie w Claude Code. Scout zamienia je w trail.'],
  live: ['Na żywo w Lookout', 'Agent szkicuje mapę zadań i zależności między nimi.'],
  discovery: [
    'Najpierw rozpoznanie',
    'Zanim powstanie kod, agent opisuje, co już jest. Nic nie rusza bez Twojej zgody.',
  ],
  brief: ['Ty decydujesz', 'Brief: prawdziwe ścieżki, ryzyka i założenia. Akceptacja otwiera pracę.'],
  criteria: ['Kryteria akceptacji', 'Każdy ticket ma kryteria z góry. Ty je zatwierdzasz, a każde wymaga dowodu.'],
  agents: ['Agenci biorą zadania', 'Dołącza drugi agent na innym modelu. Każdy bierze odblokowany ticket.'],
  asks: ['Agent pyta', 'Pytanie trafia do Ciebie: jedna kolejka, najpilniejsze na górze.'],
  answer: ['Odpowiedź', 'Wybierz podpowiedź albo odpowiedz po swojemu.'],
  decision: ['Decyzja zapisana', 'Twoja decyzja, Twoimi słowami: kto, co i dlaczego.'],
  challenge: [
    'Założenie podważone',
    'Agent znalazł dowód, że założenie nie trzyma. Widzisz to, zanim plan się rozjedzie.',
  ],
  verify: ['Weryfikacja', 'Teamtrail uruchamia testy repozytorium. Gotowe = testy przeszły.'],
  done: ['Trail ukończony', 'Każdy ticket zamknięty, każda decyzja zapisana.'],
  status: ['Z poziomu agenta', 'Ten sam stan widać w Claude Code: /scout status.'],
};

export const END = { works: 'Działa z Claude Code, Codex i każdym agentem MCP' };

export const IDEA = 'Free shipping on orders over $50';
export const ANSWER = 'After discounts: what the customer actually pays has to reach $50.';

/** `teamtrail connect claude`, as it prints for the published package. */
export const CONNECT = (version) => connectLines({ version, project: 'acme-shop' });

/** Claude Code, the moment the agent charts the trail. `trail` is start_trail's result. */
export const NEW_TRAIL = (trail) => [
  { t: '✻ Welcome to Claude Code', cls: 'acc box' },
  { t: '  cwd: ~/acme-shop · MCP: teamtrail connected', cls: 'dim' },
  { t: '' },
  { t: `/scout new "${IDEA}"`, type: true, prompt: '> ' },
  { t: `● teamtrail · start_trail ("${trail.title}", ${trail.count} tickets)`, cls: 'ok' },
  { t: '  ⎿ Discovery first: a brief on what exists, for you to accept', cls: 'dim' },
  { t: `● Trail ${trail.key} is mapped. Open the Lookout to follow it.`, cls: 'scout', pause: 1800 },
];

/** Claude Code's /scout status, from the status tool's real result. */
export const STATUS = (s) => [
  { t: '✻ Welcome back to Claude Code', cls: 'acc box' },
  { t: '' },
  { t: '/scout status', type: true, prompt: '> ' },
  { t: '● teamtrail · status', cls: 'ok' },
  { t: `  ${s.trail} · ${s.progress}` },
  { t: `  Spend     ${s.spend}`, cls: 'dim' },
  ...s.lines.map((t) => ({ t: `  ${t}`, cls: 'dim' })),
  { t: `● ${s.closing}`, cls: 'scout', pause: 2200 },
];
