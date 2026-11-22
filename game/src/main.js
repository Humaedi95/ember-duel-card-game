// Ember Duel — wiring: input (mouse + keyboard), turns, sounds and shot modes.
// The page loads this module only; game rules live in state.js, cards in cards.js,
// drawing in render.js, sounds in sound.js and demo states in shots.js.

import { newGame, startDuel, playCard, aiChooseCard, beginTurn, canPlay } from './state.js';
import { renderTable, renderTitleCards, renderEndScreen, showOverlay } from './render.js';
import { gameForShot } from './shots.js';
import {
  isMuted, toggleMute, soundPick, soundPlay, soundHit,
  soundDraw, soundWin, soundLose, soundTurn,
} from './sound.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261123;

let game = gameForShot(shot) ?? newGame(seed);
let selectedUid = null;
let aiBusy = false;

/** The UI state renderTable needs: which card is selected right now. */
function ui() {
  return { selectedUid };
}

/** Redraw the table and the end screen when the duel is over. */
function refresh() {
  renderTable(game, ui());
  if (game.phase === 'won' || game.phase === 'lost') {
    renderEndScreen(game);
    showOverlay('endScreen', true);
    showOverlay('titleScreen', false);
  }
}

/** Begin a fresh duel from the title screen. */
function beginDuel() {
  game = newGame(seed + Math.floor(Math.random() * 1000));
  selectedUid = null;
  startDuel(game);
  showOverlay('titleScreen', false);
  showOverlay('endScreen', false);
  soundDraw();
  refresh();
}

/** Play the selected card, with sounds and a little shake on the foe's life bar. */
function playSelected() {
  if (game.phase !== 'player' || aiBusy || !selectedUid) return;
  const card = game.you.hand.find((c) => c.uid === selectedUid);
  if (!card) return;
  if (!canPlay(game.you, card)) {
    flashMana();
    return;
  }
  const result = playCard(game, 'you', selectedUid);
  selectedUid = null;
  if (!result) return;
  soundPlay();
  if (result.atk > 0) {
    soundHit();
    shakeFighter('foe');
  }
  if (game.phase === 'won') soundWin();
  refresh();
}

/** End your turn and let Cinder play, one card at a time so you can follow it. */
function endTurn() {
  if (game.phase !== 'player' || aiBusy) return;
  aiBusy = true;
  selectedUid = null;
  game.phase = 'ai';
  game.chainSuit = null;
  // Cinder's turn begins like yours: mana grows with the turn number, then a draw.
  beginTurn(game, game.foe, game.turn);
  refresh();
  // The AI picks one card, plays it, and the table updates — a beat per card.
  const step = () => {
    if (game.phase !== 'ai') {
      aiBusy = false;
      refresh();
      return;
    }
    const card = aiChooseCard(game);
    if (!card) {
      game.foeChainSuit = null;
      game.turn++;
      game.phase = 'player';
      beginTurn(game, game.you, game.turn);
      pushLogLine(`— Turn ${game.turn}: your move. Mana ${game.you.mana}, draw a card.`);
      aiBusy = false;
      soundTurn();
      refresh();
      return;
    }
    const move = playCard(game, 'foe', card.uid);
    if (!move) {
      aiBusy = false;
      refresh();
      return;
    }
    soundPlay();
    if (move.atk > 0) {
      soundHit();
      shakeFighter('you');
    }
    if (game.phase === 'lost') {
      soundLose();
      aiBusy = false;
    }
    refresh();
    if (game.phase === 'ai') window.setTimeout(step, 700);
  };
  window.setTimeout(step, 600);
}

/** Append a line to the battle log (kept short by state.pushLog's own trim). */
function pushLogLine(line) {
  game.log.push(line);
  if (game.log.length > 6) game.log.splice(0, game.log.length - 6);
}

/** Briefly shake a fighter's panel when they take damage. */
function shakeFighter(who) {
  const zone = document.getElementById(who === 'foe' ? 'foeZone' : 'youZone');
  if (!zone) return;
  zone.classList.remove('shake');
  void zone.offsetWidth;
  zone.classList.add('shake');
}

/** Flash the mana row when a card costs more than you have. */
function flashMana() {
  const row = document.getElementById('youMana');
  if (!row) return;
  row.classList.remove('flash');
  void row.offsetWidth;
  row.classList.add('flash');
}

/** Click a card in your hand: select it, or play it if it is already selected. */
function onHandClick(event) {
  if (game.phase !== 'player' || aiBusy) return;
  const cardEl = event.target.closest('.card[data-uid]');
  if (!cardEl) return;
  const uid = cardEl.getAttribute('data-uid');
  if (selectedUid === uid) {
    playSelected();
    return;
  }
  selectedUid = uid;
  soundPick();
  refresh();
}

/** Keyboard play: 1–7 select, Enter/Space plays, E ends the turn, M mutes. */
function onKeyDown(event) {
  if (event.key === 'm' || event.key === 'M') {
    const nowMuted = toggleMute();
    document.getElementById('muteBtn').textContent = nowMuted ? '🔇 Muted' : '🔊 Sound';
    return;
  }
  if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    beginDuel();
    return;
  }
  if ((game.phase === 'won' || game.phase === 'lost') && event.key === 'Enter') {
    beginDuel();
    return;
  }
  if (game.phase !== 'player' || aiBusy) return;
  if (event.key >= '1' && event.key <= '7') {
    const idx = Number(event.key) - 1;
    const card = game.you.hand[idx];
    if (card) {
      selectedUid = card.uid;
      soundPick();
      refresh();
    }
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    playSelected();
    return;
  }
  if (event.key === 'e' || event.key === 'E') {
    endTurn();
  }
}

/** Wire every button and the table's clicks once the page is ready. */
function wireUp() {
  document.getElementById('startBtn').addEventListener('click', beginDuel);
  document.getElementById('againBtn').addEventListener('click', beginDuel);
  document.getElementById('endTurnBtn').addEventListener('click', endTurn);
  document.getElementById('youHand').addEventListener('click', onHandClick);
  document.getElementById('muteBtn').addEventListener('click', () => {
    const nowMuted = toggleMute();
    document.getElementById('muteBtn').textContent = nowMuted ? '🔇 Muted' : '🔊 Sound';
  });
  document.getElementById('helpBtn').addEventListener('click', () => showOverlay('rulesScreen', true));
  document.getElementById('closeRulesBtn').addEventListener('click', () => showOverlay('rulesScreen', false));
  document.addEventListener('keydown', onKeyDown);
  // Expose a tiny handle for scripted play-tests (the browser console, not the game):
  // window.__emberDuel = { game, beginDuel, playSelected, endTurn }.
  window.__emberDuel = {
    get game() { return game; },
    beginDuel,
    playSelected,
    endTurn,
    select(uid) { selectedUid = uid; refresh(); },
  };
}

// ---- boot -----------------------------------------------------------------

renderTitleCards();
wireUp();
if (game.phase === 'title') {
  showOverlay('titleScreen', true);
  showOverlay('endScreen', false);
  renderTable(game, ui());
} else {
  // A shot mode (?shot=play|win|loss): render its frozen table straight away.
  showOverlay('titleScreen', false);
  renderTable(game, ui());
  if (game.phase === 'won' || game.phase === 'lost') {
    renderEndScreen(game);
    showOverlay('endScreen', true);
  }
}
