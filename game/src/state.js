// Ember Duel — game state, turn rules and the AI opponent.
// Rules in one place: mana grows +1 a turn (max 10), draw a card each turn,
// playing a card spends mana and applies its attack / shield / heal / draw / mana.
// Ember Chain: a second card of the same suit in one turn gains +2 attack.
// Shield absorbs damage first and stays until broken. First to 0 life loses.

import { buildDeck } from './cards.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const HAND_LIMIT = 7;
export const CHAIN_BONUS = 2;

/** A fresh fighter: life, shield, mana, hand, deck, discard pile. */
function newFighter(seed) {
  return {
    life: MAX_LIFE,
    shield: 0,
    mana: 0,
    maxMana: 0,
    hand: [],
    deck: buildDeck(seed),
    discard: [],
  };
}

/** A fresh duel. `seed` drives both decks so a seeded game replays exactly. */
export function newGame(seed = 20261123) {
  const game = {
    seed,
    turn: 1,
    phase: 'title', // title | player | ai | won | lost
    you: newFighter(seed),
    foe: newFighter(seed + 77),
    log: [],
    lastPlayed: null, // { name, suit, atk, by: 'you' | 'foe' }
    chainSuit: null, // suit of your last played card this turn, for the chain bonus
    foeChainSuit: null,
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, chains: 0 },
    wins: 0,
    losses: 0,
  };
  return game;
}

/** Draw `n` cards from a fighter's deck into their hand (reshuffle discard when empty). */
export function drawCards(fighter, n) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.deck = fighter.discard.splice(0);
      // A plain shuffle is fine for a reshuffle; order no longer matters for the demo.
      for (let j = fighter.deck.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [fighter.deck[j], fighter.deck[k]] = [fighter.deck[k], fighter.deck[j]];
      }
    }
    const card = fighter.deck.pop();
    if (fighter.hand.length < HAND_LIMIT) fighter.hand.push(card);
    drawn++;
  }
  return drawn;
}

/** Start a duel: deal 3 cards each, turn 1, your mana is 1. */
export function startDuel(game) {
  game.phase = 'player';
  game.turn = 1;
  game.log = [];
  game.lastPlayed = null;
  game.chainSuit = null;
  game.foeChainSuit = null;
  game.stats = { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, chains: 0 };
  game.you = newFighter(game.seed);
  game.foe = newFighter(game.seed + 77);
  drawCards(game.you, 3);
  drawCards(game.foe, 3);
  beginTurn(game, game.you, 1);
  pushLog(game, 'The duel begins — your move, Keeper.');
}

/** Begin a fighter's turn: mana grows, refills, and they draw a card. */
export function beginTurn(game, fighter, turnNo) {
  fighter.maxMana = Math.min(MAX_MANA, turnNo);
  fighter.mana = fighter.maxMana;
  drawCards(fighter, 1);
}

/** Damage after shield: returns the life damage actually dealt. */
export function dealDamage(target, raw) {
  const soaked = Math.min(target.shield, raw);
  target.shield -= soaked;
  const lifeHit = raw - soaked;
  target.life = Math.max(0, target.life - lifeHit);
  return { soaked, lifeHit };
}

/** Can this fighter afford to play this card right now? */
export function canPlay(fighter, card) {
  return card && fighter.mana >= card.cost;
}

/** Apply one card's effects. Returns a human-readable summary line. */
export function playCard(game, who, cardUid) {
  const me = who === 'you' ? game.you : game.foe;
  const them = who === 'you' ? game.foe : game.you;
  const idx = me.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return null;
  const card = me.hand[idx];
  if (!canPlay(me, card)) return null;

  const chainSuit = who === 'you' ? game.chainSuit : game.foeChainSuit;
  const chained = card.atk > 0 && chainSuit === card.suit;
  const atk = card.atk + (chained ? CHAIN_BONUS : 0);

  me.mana -= card.cost;
  me.hand.splice(idx, 1);
  me.discard.push(card);
  if (who === 'you') game.chainSuit = card.suit;
  else game.foeChainSuit = card.suit;

  const parts = [];
  if (atk > 0) {
    const hit = dealDamage(them, atk);
    if (who === 'you') game.stats.damageDealt += hit.lifeHit;
    else game.stats.damageTaken += hit.lifeHit;
    parts.push(`⚔️ ${atk} damage${hit.soaked > 0 ? ` (${hit.soaked} soaked by shield)` : ''}`);
  }
  if (card.shield > 0) {
    me.shield += card.shield;
    parts.push(`🛡 +${card.shield} shield`);
  }
  if (card.heal > 0) {
    me.life = Math.min(MAX_LIFE, me.life + card.heal);
    parts.push(`💚 heal ${card.heal}`);
  }
  if (card.draw > 0) {
    drawCards(me, card.draw);
    parts.push(`🃏 draw ${card.draw}`);
  }
  if (card.mana > 0) {
    me.mana = Math.min(MAX_MANA, me.mana + card.mana);
    parts.push(`🔷 +${card.mana} mana`);
  }
  if (chained) {
    game.stats.chains++;
    parts.push('🔗 Ember Chain +2!');
  }
  game.stats.cardsPlayed++;
  game.lastPlayed = { name: card.name, suit: card.suit, atk, by: who };
  const whoName = who === 'you' ? 'You play' : 'Cinder plays';
  pushLog(game, `${whoName} ${card.name} — ${parts.join(' · ')}`);

  if (them.life <= 0) {
    game.phase = who === 'you' ? 'won' : 'lost';
    if (game.phase === 'won') game.wins++;
    else game.losses++;
    pushLog(game, game.phase === 'won' ? '🏆 Cinder falls — you win the duel!' : '💀 Your ember fades — Cinder wins.');
  } else if (me.life <= 0) {
    game.phase = who === 'you' ? 'lost' : 'won';
    if (game.phase === 'won') game.wins++;
    else game.losses++;
  }
  return { card, atk, chained, parts };
}

/** End your turn: the AI takes its turn, then a new round begins for you. */
export function endPlayerTurn(game) {
  if (game.phase !== 'player') return [];
  game.phase = 'ai';
  game.chainSuit = null;
  // Cinder's turn begins like yours: mana grows with the turn number, then a draw.
  beginTurn(game, game.foe, game.turn);
  const moves = aiTakeTurn(game);
  if (game.phase === 'ai') {
    game.turn++;
    game.foeChainSuit = null;
    game.phase = 'player';
    beginTurn(game, game.you, game.turn);
    pushLog(game, `— Turn ${game.turn}: your move. Mana ${game.you.mana}, draw a card.`);
  }
  return moves;
}

/** How much the AI values a card: damage and draw first, defence when hurt. */
export function aiCardValue(game, card) {
  let value = card.atk * 1.0 + card.shield * 0.7 + card.heal * 0.6 + card.draw * 2.0 + card.mana * 1.2;
  if (game.foe.life <= 12) value += card.shield * 0.8 + card.heal * 0.8;
  if (game.you.life <= card.atk + 2) value += 6; // a killing blow is worth everything
  if (game.foeChainSuit === card.suit && card.atk > 0) value += 1.5; // the AI chains too
  return value;
}

/** The AI's single best affordable card right now, or null when it should stop. */
export function aiChooseCard(game) {
  const affordable = game.foe.hand.filter((c) => canPlay(game.foe, c));
  if (affordable.length === 0) return null;
  affordable.sort((a, b) => aiCardValue(game, b) - aiCardValue(game, a));
  const best = affordable[0];
  // The AI never wastes its whole hand on tiny cards when a big one is coming.
  if (best.cost > 1 && best.atk < 3 && game.foe.hand.length > 4) return null;
  return best;
}

/** The AI plays its best affordable cards until it runs out of mana or cards. */
export function aiTakeTurn(game) {
  const moves = [];
  let guard = 0;
  while (game.phase === 'ai' && guard++ < 12) {
    const best = aiChooseCard(game);
    if (!best) break;
    const result = playCard(game, 'foe', best.uid);
    if (!result) break;
    moves.push(result);
  }
  if (game.phase === 'ai') pushLog(game, 'Cinder ends their turn.');
  return moves;
}

/** Keep the battle log short and newest-first in spirit (we keep the last 6). */
export function pushLog(game, line) {
  game.log.push(line);
  if (game.log.length > 6) game.log.splice(0, game.log.length - 6);
}
