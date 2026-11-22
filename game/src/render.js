// Ember Duel — DOM rendering: cards, hands, life bars, mana and the battle log.
// Rendering is a pure function of the game state; animations live in styles.css.

import { SUITS } from './cards.js';
import { MAX_MANA, MAX_LIFE } from './state.js';

/** Grab an element by id, throwing a clear error when the page is missing it. */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Ember Duel: missing #${id} in the page`);
  return node;
}

/** One card's HTML: cost gem, suit icon, name, attack and shield pips, blurb. */
export function cardHtml(card, opts = {}) {
  const suit = SUITS[card.suit];
  const extra = [];
  if (card.heal > 0) extra.push(`💚 ${card.heal}`);
  if (card.draw > 0) extra.push(`🃏 +${card.draw}`);
  if (card.mana > 0) extra.push(`🔷 +${card.mana}`);
  const stats = [
    card.atk > 0 ? `⚔️ ${card.atk}` : '',
    card.shield > 0 ? `🛡️ ${card.shield}` : '',
    ...extra,
  ].filter(Boolean).join('  ');
  const cls = [
    'card',
    `suit-${card.suit}`,
    opts.faceDown ? 'faceDown' : '',
    opts.selected ? 'selected' : '',
    opts.playable === false ? 'unplayable' : '',
    opts.justPlayed ? 'justPlayed' : '',
    opts.dealt ? 'dealt' : '',
  ].filter(Boolean).join(' ');
  const style = opts.dealDelay != null ? ` style="animation-delay:${opts.dealDelay}ms"` : '';
  if (opts.faceDown) {
    return `<div class="${cls}"${style}><div class="cardBack">🔥<span>EMBER</span></div></div>`;
  }
  return `<div class="${cls}" data-uid="${card.uid}"${style} tabindex="0" role="button" aria-label="${card.name}, cost ${card.cost}, ${stats || 'no attack'}">
    <div class="cardCost" title="Mana cost">🔷 ${card.cost}</div>
    <div class="cardSuit" style="color:${suit.color}">${suit.icon}</div>
    <div class="cardSuitName">${suit.name}</div>
    <div class="cardName">${card.name}</div>
    <div class="cardStats">${stats || '—'}</div>
    <div class="cardBlurb">${card.blurb}</div>
  </div>`;
}

/** Mana crystals: filled for mana left, empty for mana spent, up to the turn's max. */
function manaHtml(fighter) {
  let out = '';
  for (let i = 0; i < MAX_MANA; i++) {
    const filled = i < fighter.mana;
    const unlocked = i < fighter.maxMana;
    out += `<span class="manaGem ${filled ? 'full' : ''} ${unlocked ? '' : 'locked'}" title="Mana ${fighter.mana}/${fighter.maxMana}">🔷</span>`;
  }
  return `${out}<span class="manaText">${fighter.mana} / ${fighter.maxMana} mana</span>`;
}

/** A life bar fill as a percentage width, with a low-life warning class. */
function lifeWidth(fighter) {
  return Math.max(0, Math.round((fighter.life / MAX_LIFE) * 100));
}

/** Render the whole table from the game state. */
export function renderTable(game, ui) {
  // Opponent: life, shield, mana, face-down hand.
  el('foeLifeFill').style.width = `${lifeWidth(game.foe)}%`;
  el('foeLifeFill').classList.toggle('lowLife', game.foe.life <= 10);
  el('foeLifeText').textContent = `${game.foe.life} / ${MAX_LIFE}`;
  el('foeShield').textContent = `🛡 ${game.foe.shield}`;
  el('foeMana').innerHTML = manaHtml(game.foe);
  el('foeHand').innerHTML = game.foe.hand
    .map((c, i) => cardHtml(c, { faceDown: true, dealDelay: i * 60 }))
    .join('');

  // You: life, shield, mana, your hand (clickable, selected card raised).
  el('youLifeFill').style.width = `${lifeWidth(game.you)}%`;
  el('youLifeFill').classList.toggle('lowLife', game.you.life <= 10);
  el('youLifeText').textContent = `${game.you.life} / ${MAX_LIFE}`;
  el('youShield').textContent = `🛡 ${game.you.shield}`;
  el('youMana').innerHTML = manaHtml(game.you);
  el('youHand').innerHTML = game.you.hand
    .map((c, i) => cardHtml(c, {
      selected: ui.selectedUid === c.uid,
      playable: game.phase === 'player' && game.you.mana >= c.cost,
      dealt: true,
      dealDelay: i * 60,
    }))
    .join('');

  // Middle: last played card, the log, turn and score.
  const last = game.lastPlayed;
  el('playedRow').innerHTML = last
    ? `<div class="playedLabel">Last played · ${last.by === 'you' ? 'You' : 'Cinder'}</div>
       <div class="playedCard suit-${last.suit}">${SUITS[last.suit].icon} ${last.name} <span>⚔️ ${last.atk}</span></div>`
    : '<div class="playedLabel">No card played yet — pick a card below.</div>';
  el('logBox').innerHTML = game.log.map((line) => `<div class="logLine">${line}</div>`).join('');
  el('turnLabel').textContent = `Turn ${game.turn}`;
  el('scoreLabel').textContent = `Wins ${game.wins} · Losses ${game.losses}`;
  el('endTurnBtn').disabled = game.phase !== 'player';

  const hint = el('chainHint');
  if (game.phase === 'player' && game.chainSuit) {
    hint.textContent = `🔗 Chain ready: play another ${SUITS[game.chainSuit].name} card for +2 attack!`;
  } else if (game.phase === 'player') {
    hint.textContent = 'Play a card, then another of the same suit to chain +2 attack.';
  } else {
    hint.textContent = '';
  }
}

/** Render the title screen's preview strip: one card of each suit. */
export function renderTitleCards() {
  const preview = [
    { uid: 'pv1', name: 'Flame Lash', suit: 'flame', cost: 2, atk: 5, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'A whip of living fire.' },
    { uid: 'pv2', name: 'Grove Guard', suit: 'leaf', cost: 3, atk: 0, shield: 8, heal: 0, draw: 0, mana: 0, blurb: 'The grove stands firm.' },
    { uid: 'pv3', name: 'Tide Draw', suit: 'tide', cost: 1, atk: 1, shield: 0, heal: 0, draw: 2, mana: 0, blurb: 'The tide brings new cards.' },
    { uid: 'pv4', name: 'Storm Call', suit: 'spark', cost: 3, atk: 7, shield: 0, heal: 0, draw: 0, mana: 0, blurb: 'The clouds answer.' },
  ];
  el('titleCards').innerHTML = preview.map((c) => cardHtml(c)).join('');
}

/** Show or hide an overlay by id. */
export function showOverlay(id, show) {
  el(id).classList.toggle('hidden', !show);
}

/** Fill the win/loss screen with the duel's result and stats. */
export function renderEndScreen(game) {
  const won = game.phase === 'won';
  el('endEmblem').textContent = won ? '🏆' : '💀';
  el('endTitle').textContent = won ? 'YOU WIN!' : 'YOU LOSE';
  el('endTitle').classList.toggle('loseTitle', !won);
  el('endText').textContent = won
    ? 'Cinder’s ember is out. The table is yours, Keeper — a flawless duel!'
    : 'Cinder’s flame burns brighter today. Shuffle up and take the rematch!';
  el('endStats').innerHTML = [
    `<div><b>${game.stats.damageDealt}</b><span>damage dealt</span></div>`,
    `<div><b>${game.stats.cardsPlayed}</b><span>cards played</span></div>`,
    `<div><b>${game.stats.chains}</b><span>ember chains</span></div>`,
    `<div><b>${game.turn}</b><span>turns</span></div>`,
    `<div><b>${game.wins}–${game.losses}</b><span>wins–losses</span></div>`,
  ].join('');
}
