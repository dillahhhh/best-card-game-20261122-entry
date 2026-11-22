// Ember Court — screenshot scenes behind ?shot=title|play|win|loss&seed=N.
// Each scene plays the real rules forward from a fresh game with a fixed
// seed and a simple greedy pilot, so the frame is what a real game looks
// like and the same seed always gives the same frame. The win and loss
// scenes try seeds in order until the pilot's side wins the duel.
import { createGame, playCard, endTurn, beginPlayerTurn, playableCards, makeRng } from './engine.js';
import { runAiTurn } from './ai.js';
import { cardById } from './cards.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Greedy pilot: the highest damage-per-mana affordable card, ties broken by cost. */
function pilotPick(game, who) {
  const playable = playableCards(game, who);
  if (playable.length === 0) return null;
  return playable
    .map((id) => cardById(id))
    .sort((a, b) => (b.attack / b.cost) - (a.attack / a.cost) || b.cost - a.cost)[0].id;
}

function pilotPlayerTurn(game) {
  let guard = 0;
  while (game.phase === 'play' && guard < 12) {
    guard += 1;
    const id = pilotPick(game, 'player');
    if (!id) break;
    if (!playCard(game, 'player', id)) break;
  }
}

function playRounds(game, rng, rounds) {
  for (let i = 0; i < rounds && game.phase !== 'over'; i += 1) {
    pilotPlayerTurn(game);
    if (game.phase === 'over') break;
    endTurn(game);
    runAiTurn(game, rng);
    if (game.phase === 'over') break;
    beginPlayerTurn(game);
  }
  return game;
}

/** First seed (1..24) whose full duel ends with `winner`. */
function findDuel(winner) {
  for (let seed = 1; seed <= 24; seed += 1) {
    const rng = makeRng(seed * 7919 + 13);
    const game = createGame(seed, 'player');
    playRounds(game, rng, 60);
    if (game.winner === winner) return game;
  }
  return null;
}

/**
 * Set `game` (already created) to the named scene and return the screen to
 * draw over it. Any unknown name is the title scene.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    const rng = makeRng(game.seed * 7919 + 13);
    playRounds(game, rng, 4);
    return { screen: SCREEN_PLAY, game };
  }
  if (name === 'win' || name === 'loss') {
    const winner = name === 'win' ? 'player' : 'ai';
    const duel = findDuel(winner);
    if (duel) return { screen: SCREEN_OVER, game: duel };
    // Fallback: a long duel always ends; show whatever it ended as.
    const rng = makeRng(999);
    playRounds(game, rng, 60);
    return { screen: SCREEN_OVER, game };
  }
  return { screen: SCREEN_TITLE, game };
}
