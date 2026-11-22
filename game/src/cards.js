// Ember Duel — the card catalogue and the deck.
// Four original suits, told apart by colour AND shape, never by text alone:
//   flame (red fire), leaf (green leaf), tide (blue drop), spark (gold bolt).
// Every card: cost in mana, attack, shield, heal, extra draw, extra mana.

export const SUITS = {
  flame: { name: 'Flame', icon: '🔥', color: '#e5484d', dark: '#7f1d1d' },
  leaf: { name: 'Leaf', icon: '🍃', color: '#2f9e44', dark: '#14532d' },
  tide: { name: 'Tide', icon: '💧', color: '#2f80ed', dark: '#1e3a8a' },
  spark: { name: 'Spark', icon: '⚡', color: '#f2a900', dark: '#713f12' },
};

// id, name, suit, cost, attack, shield, heal, draw, mana, blurb
export const CARD_DEFS = [
  { id: 'ember-spark', name: 'Ember Spark', suit: 'flame', cost: 1, atk: 3, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'A quick lick of flame.' },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'flame', cost: 2, atk: 5, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'A whip of living fire.' },
  { id: 'cinder-claw', name: 'Cinder Claw', suit: 'flame', cost: 2, atk: 4, shield: 2, heal: 0, draw: 0, mana: 0, blurb: 'Claws of hot ash.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'flame', cost: 4, atk: 7, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'It eats the whole field.' },
  { id: 'inferno', name: 'Inferno', suit: 'flame', cost: 5, atk: 10, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'The sky itself burns.' },
  { id: 'bark-shield', name: 'Bark Shield', suit: 'leaf', cost: 1, atk: 0, shield: 5, heal: 0, draw: 0, mana: 0, blurb: 'Old bark, hard as stone.' },
  { id: 'thorn-vine', name: 'Thorn Vine', suit: 'leaf', cost: 2, atk: 3, shield: 3, heal: 0, draw: 0, mana: 0, blurb: 'It bites as it guards.' },
  { id: 'moss-mend', name: 'Moss Mend', suit: 'leaf', cost: 2, atk: 0, shield: 2, heal: 6, draw: 0, mana: 0, blurb: 'Soft moss knits wounds.' },
  { id: 'grove-guard', name: 'Grove Guard', suit: 'leaf', cost: 3, atk: 0, shield: 8, heal: 0, draw: 0, mana: 0, blurb: 'The grove stands firm.' },
  { id: 'bramble-trap', name: 'Bramble Trap', suit: 'leaf', cost: 3, atk: 6, shield: 2, heal: 0, draw: 0, mana: 0, blurb: 'Step in and regret it.' },
  { id: 'tide-draw', name: 'Tide Draw', suit: 'tide', cost: 1, atk: 1, shield: 0, heal: 0, draw: 2, mana: 0, blurb: 'The tide brings new cards.' },
  { id: 'deep-current', name: 'Deep Current', suit: 'tide', cost: 2, atk: 4, shield: 0, heal: 0, draw: 1, mana: 0, blurb: 'Cold water, sharp teeth.' },
  { id: 'mana-spring', name: 'Mana Spring', suit: 'tide', cost: 2, atk: 1, shield: 0, heal: 0, draw: 0, mana: 2, blurb: 'Drink deep, cast more.' },
  { id: 'frost-shard', name: 'Frost Shard', suit: 'tide', cost: 3, atk: 6, shield: 1, heal: 0, draw: 0, mana: 0, blurb: 'A splinter of winter.' },
  { id: 'flood', name: 'Flood', suit: 'tide', cost: 4, atk: 8, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'The river takes all.' },
  { id: 'static-zap', name: 'Static Zap', suit: 'spark', cost: 1, atk: 3, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'A sting of bright static.' },
  { id: 'volt-shield', name: 'Volt Shield', suit: 'spark', cost: 2, atk: 2, shield: 4, heal: 0, draw: 0, mana: 0, blurb: 'A humming wall of light.' },
  { id: 'storm-call', name: 'Storm Call', suit: 'spark', cost: 3, atk: 7, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'The clouds answer.' },
  { id: 'ember-burst', name: 'Ember Burst', suit: 'spark', cost: 4, atk: 6, shield: 0, heal: 0, draw: 1, mana: 0, blurb: 'Boom — and a fresh card.' },
  { id: 'thunderhead', name: 'Thunderhead', suit: 'spark', cost: 5, atk: 9, shield: 0, heal: 0, draw: 1, mana: 0, blurb: 'Thunder, then silence.' },
];

/** How many copies of each card go into a 30-card deck. Cheap cards appear twice. */
const DECK_COPIES = {
  'ember-spark': 2, 'flame-lash': 2, 'cinder-claw': 2, 'wildfire': 1, 'inferno': 1,
  'bark-shield': 2, 'thorn-vine': 2, 'moss-mend': 2, 'grove-guard': 1, 'bramble-trap': 1,
  'tide-draw': 2, 'deep-current': 2, 'mana-spring': 1, 'frost-shard': 1, 'flood': 1,
  'static-zap': 2, 'volt-shield': 1, 'storm-call': 1, 'ember-burst': 1, 'thunderhead': 1,
};

/** A small deterministic RNG (mulberry32) so demo shots and replays are stable. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh shuffled 30-card deck of card instances (each with a unique uid). */
export function buildDeck(seed) {
  const rng = makeRng(seed);
  const cards = [];
  let uid = 0;
  for (const def of CARD_DEFS) {
    const copies = DECK_COPIES[def.id] ?? 1;
    for (let i = 0; i < copies; i++) cards.push({ ...def, uid: `c${uid++}` });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Look a card definition up by id. */
export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id);
}
