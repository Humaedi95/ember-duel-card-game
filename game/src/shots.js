// Ember Duel — deterministic demo states for screenshots.
// ?shot=start shows the title screen, ?shot=play a mid-game table,
// ?shot=win the victory screen and ?shot=loss the defeat screen.
// Every shot uses a fixed seed, so the same URL always renders the same table.

import { newGame, startDuel } from './state.js';
import { cardById } from './cards.js';

/** A card instance from a definition id, with a stable demo uid. */
function demoCard(id, n) {
  const def = cardById(id);
  return { ...def, uid: `demo-${id}-${n}` };
}

/** A mid-game table: turn 4, both fighters bloodied, hands full, a chain ready. */
export function demoMidGame() {
  const game = newGame(4242);
  startDuel(game);
  game.turn = 4;
  game.you.maxMana = 5; game.you.mana = 5;
  game.foe.maxMana = 5; game.foe.mana = 2;
  game.you.life = 24; game.you.shield = 4;
  game.foe.life = 19; game.foe.shield = 2;
  game.you.hand = [
    demoCard('flame-lash', 1), demoCard('bark-shield', 1), demoCard('storm-call', 1),
    demoCard('tide-draw', 1), demoCard('thorn-vine', 1), demoCard('mana-spring', 1),
  ];
  game.foe.hand = [
    demoCard('ember-spark', 1), demoCard('static-zap', 1), demoCard('bark-shield', 2),
    demoCard('deep-current', 1), demoCard('frost-shard', 1),
  ];
  game.chainSuit = 'flame';
  game.lastPlayed = { name: 'Flame Lash', suit: 'flame', atk: 5, by: 'you' };
  game.stats = { damageDealt: 11, damageTaken: 6, cardsPlayed: 7, chains: 2 };
  game.log = [
    'You play Flame Lash — ⚔️ 5 damage (2 soaked by shield)',
    'Cinder plays Bark Shield — 🛡 +5 shield',
    'You play Ember Spark — ⚔️ 3 damage · 🔗 Ember Chain +2!',
    'Cinder plays Deep Current — ⚔️ 4 damage · 🃏 draw 1',
    '— Turn 4: your move. Mana 5, draw a card.',
  ];
  game.phase = 'player';
  return game;
}

/** A won duel: the foe at 0 life, the victory screen up, a strong final table. */
export function demoWin() {
  const game = demoMidGame();
  game.foe.life = 0;
  game.foe.shield = 0;
  game.you.life = 18;
  game.you.hand = [
    demoCard('inferno', 1), demoCard('grove-guard', 1), demoCard('thunderhead', 1),
  ];
  game.foe.hand = [demoCard('ember-spark', 2), demoCard('static-zap', 2)];
  game.lastPlayed = { name: 'Inferno', suit: 'flame', atk: 10, by: 'you' };
  game.stats = { damageDealt: 30, damageTaken: 12, cardsPlayed: 14, chains: 4 };
  game.turn = 7;
  game.wins = 1;
  game.log = [
    'You play Inferno — ⚔️ 10 damage · 🔗 Ember Chain +2!',
    '🏆 Cinder falls — you win the duel!',
  ];
  game.phase = 'won';
  return game;
}

/** A lost duel: you at 0 life, the defeat screen up. */
export function demoLoss() {
  const game = demoMidGame();
  game.you.life = 0;
  game.you.shield = 0;
  game.foe.life = 14;
  game.you.hand = [demoCard('bark-shield', 3), demoCard('moss-mend', 1)];
  game.foe.hand = [
    demoCard('wildfire', 1), demoCard('storm-call', 2), demoCard('flood', 1),
  ];
  game.lastPlayed = { name: 'Wildfire', suit: 'flame', atk: 7, by: 'foe' };
  game.stats = { damageDealt: 16, damageTaken: 30, cardsPlayed: 11, chains: 1 };
  game.turn = 8;
  game.losses = 1;
  game.log = [
    'Cinder plays Wildfire — ⚔️ 7 damage',
    '💀 Your ember fades — Cinder wins.',
  ];
  game.phase = 'lost';
  return game;
}

/** Build the game for a shot name; null means "just play normally". */
export function gameForShot(shot) {
  if (shot === 'play') return demoMidGame();
  if (shot === 'win') return demoWin();
  if (shot === 'loss') return demoLoss();
  if (shot === 'start') {
    const game = newGame(4242);
    game.phase = 'title';
    return game;
  }
  return null;
}

