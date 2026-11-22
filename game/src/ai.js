// Ember Court — the Warden, the AI opponent. A greedy heuristic the player can
// read and counter: it values damage per mana, chases the element advantage
// against your last card, banks a shield when hurt, and pounces on lethal.
// `rng` only breaks ties, so a seed replays the same duel.
import { cardById, advantageBonus } from './cards.js';
import { playableCards, playCard } from './engine.js';

function scoreCard(game, card) {
  const ai = game.ai;
  const foe = game.player;
  const adv = advantageBonus(card.element, foe.lastElement);
  const surge = ai.surgeElement === card.element ? 2 : 0;
  let value = card.attack + adv + surge;
  if (card.effect === 'draw') value += 2;
  if (card.effect === 'heal') value += ai.life <= 12 ? 5 : 1;
  if (card.effect === 'shield') value += ai.life <= 12 ? 4 : 1.5;
  if (card.effect === 'pierce') value += foe.shield > 0 ? 3 : 0.5;
  if (card.effect === 'drain') value += 1.5;
  // Damage per mana, with a small premium for finishing the job.
  const lethal = value >= foe.life + foe.shield;
  return value / Math.max(1, card.cost) + (lethal ? 10 : 0) + (adv ? 0.6 : 0) + (surge ? 0.6 : 0);
}

/** One AI decision: the best card to play now, or null when it should stop. */
export function chooseCard(game, rng) {
  const playable = playableCards(game, 'ai');
  if (playable.length === 0) return null;
  const scored = playable
    .map((id) => ({ id, score: scoreCard(game, cardById(id)) + rng() * 0.15 }))
    .sort((a, b) => b.score - a.score);
  return scored[0].id;
}

/**
 * Play the whole AI turn synchronously (used by tests and the screenshot
 * stager). Returns the list of play events, in order.
 */
export function runAiTurn(game, rng) {
  const events = [];
  let guard = 0;
  while (game.phase !== 'over' && guard < 12) {
    guard += 1;
    const id = chooseCard(game, rng);
    if (!id) break;
    const event = playCard(game, 'ai', id);
    if (!event) break;
    events.push(event);
  }
  return events;
}
