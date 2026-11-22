// Ember Court — boot and table wiring. Owns the game instance, click and
// keyboard input, the animated AI turn, and the ?shot= screenshot scenes.
import { createGame, playCard, endTurn, beginPlayerTurn, makeRng } from './engine.js';
import { chooseCard } from './ai.js';
import { renderTable, renderTitle, renderOver, floatDamage, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';
import * as sfx from './audio.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || '7');
const seed = Number.isFinite(seedParam) ? seedParam : 7;

let game = createGame(seed, 'player');
let screen = SCREEN_TITLE;
let selected = null;
let muted = false;
let bestTurns = null;

const ui = () => ({ selected, muted });

function showTitle() {
  screen = SCREEN_TITLE;
  renderTitle(bestTurns);
}

function showTable() {
  screen = SCREEN_PLAY;
  renderTable(game, ui());
}

function showOver() {
  screen = SCREEN_OVER;
  if (game.winner === 'player') {
    bestTurns = bestTurns === null ? game.turn : Math.min(bestTurns, game.turn);
    sfx.winSound();
  } else {
    sfx.loseSound();
  }
  renderOver(game);
}

function refresh() {
  if (screen === SCREEN_TITLE) renderTitle(bestTurns);
  else if (screen === SCREEN_OVER) renderOver(game);
  else renderTable(game, ui());
}

function playSelectedCard(cardId) {
  if (screen !== SCREEN_PLAY || game.phase !== 'play') return;
  const event = playCard(game, 'player', cardId);
  if (!event) return;
  selected = null;
  sfx.playCardSound();
  if (event.surge) sfx.surgeSound();
  if (event.effect === 'heal' || event.effect === 'drain') sfx.healSound();
  if (event.effect === 'shield') sfx.shieldSound();
  if (event.effect === 'draw') sfx.drawSound();
  renderTable(game, ui());
  floatDamage('ai', `−${event.attack}`, 'dmg');
  if (event.effect === 'heal' || event.effect === 'drain') floatDamage('player', '+3', 'heal');
  sfx.hitSound(event.attack >= 6);
  if (game.phase === 'over') setTimeout(showOver, 650);
}

async function runAiTurnAnimated() {
  const rng = makeRng((Date.now() ^ 0x5f3759df) >>> 0);
  await new Promise((resolve) => setTimeout(resolve, 500));
  let guard = 0;
  while (game.phase === 'ai' && guard < 12) {
    guard += 1;
    const id = chooseCard(game, rng);
    if (!id) break;
    const event = playCard(game, 'ai', id);
    if (!event) break;
    sfx.playCardSound();
    if (event.surge) sfx.surgeSound();
    renderTable(game, ui());
    floatDamage('player', `−${event.attack}`, 'dmg');
    if (event.effect === 'heal' || event.effect === 'drain') floatDamage('ai', '+3', 'heal');
    sfx.hitSound(event.attack >= 6);
    if (game.phase === 'over') break;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  if (game.phase === 'over') {
    setTimeout(showOver, 650);
    return;
  }
  beginPlayerTurn(game);
  sfx.turnSound();
  renderTable(game, ui());
}

function endPlayerTurn() {
  if (screen !== SCREEN_PLAY || game.phase !== 'play') return;
  sfx.clickSound();
  if (!endTurn(game)) return;
  renderTable(game, ui());
  void runAiTurnAnimated();
}

function newGame() {
  const freshSeed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  game = createGame(freshSeed, 'player');
  selected = null;
  showTable();
  sfx.turnSound();
}

// ---- input: one delegated click listener, one keyboard listener ----
document.getElementById('app').addEventListener('click', (ev) => {
  const target = ev.target.closest('[data-card], button');
  if (!target) return;
  const id = target.id;
  if (id === 'btn-play' || id === 'btn-again') { sfx.clickSound(); newGame(); return; }
  if (id === 'btn-title') { sfx.clickSound(); showTitle(); return; }
  if (id === 'btn-end') { endPlayerTurn(); return; }
  if (id === 'btn-restart') { sfx.clickSound(); newGame(); return; }
  if (id === 'btn-mute') { muted = sfx.toggleMute(); refresh(); return; }
  if (id === 'btn-how' || id === 'btn-how-title') {
    const overlay = document.getElementById('how-overlay');
    if (overlay) overlay.classList.remove('hidden');
    return;
  }
  if (id === 'btn-close-how') {
    const overlay = document.getElementById('how-overlay');
    if (overlay) overlay.classList.add('hidden');
    return;
  }
  const cardEl = ev.target.closest('[data-card]');
  if (cardEl && cardEl.dataset.card) {
    const cardId = cardEl.dataset.card;
    if (selected === cardId) playSelectedCard(cardId);
    else { selected = cardId; sfx.clickSound(); renderTable(game, ui()); }
  }
});

document.addEventListener('keydown', (ev) => {
  if (screen === SCREEN_TITLE && (ev.key === 'Enter' || ev.key === ' ')) { newGame(); return; }
  if (screen === SCREEN_OVER && (ev.key === 'Enter' || ev.key === 'r' || ev.key === 'R')) { newGame(); return; }
  if (screen !== SCREEN_PLAY) return;
  if (ev.key >= '1' && ev.key <= '7') {
    const index = Number(ev.key) - 1;
    const id = game.player.hand[index];
    if (id) { selected = id; sfx.clickSound(); renderTable(game, ui()); }
  } else if (ev.key === 'Enter' || ev.key === ' ') {
    if (selected) playSelectedCard(selected);
  } else if (ev.key === 'e' || ev.key === 'E') {
    endPlayerTurn();
  } else if (ev.key === 'm' || ev.key === 'M') {
    muted = sfx.toggleMute(); refresh();
  } else if (ev.key === 'r' || ev.key === 'R') {
    newGame();
  } else if (ev.key === 'Escape') {
    selected = null;
    renderTable(game, ui());
  }
});

// ---- boot: a ?shot= scene renders one fixed frame; otherwise the title ----
if (shotName) {
  const staged = stageShot(shotName, game);
  game = staged.game;
  screen = staged.screen;
  if (screen === SCREEN_TITLE) renderTitle(bestTurns);
  else if (screen === SCREEN_OVER) renderOver(game);
  else renderTable(game, ui());
} else {
  showTitle();
}
