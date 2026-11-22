// Ember Court — the rules engine. Pure logic, no DOM: the same code runs the
// game in the browser and the headless play-tests.
import { buildDeck, cardById, advantageBonus } from './cards.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const HAND_LIMIT = 10;
export const START_HAND = 4;
export const FATIGUE_DAMAGE = 2;

/** Deterministic rng (mulberry32) so a seed always replays the same game. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newSide(rng) {
  return {
    life: MAX_LIFE,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    lastElement: null,
    surgeElement: null,
    cardsPlayed: 0,
    damageDealt: 0,
    healed: 0,
  };
}

/** A fresh game. `seed` fixes every shuffle; `first` is 'player' or 'ai'. */
export function createGame(seed = 1, first = 'player') {
  const rng = makeRng(seed);
  const game = {
    seed,
    turn: 1,
    active: first,
    phase: 'play', // 'play' | 'ai' | 'over'
    winner: null,
    player: newSide(rng),
    ai: newSide(rng),
    log: [],
    lastPlayed: null,
  };
  for (let i = 0; i < START_HAND; i += 1) {
    drawCard(game, 'player');
    drawCard(game, 'ai');
  }
  // Opening hands always hold a 1-cost card, so turn 1 is never a dead turn:
  // swap a random hand card with a 1-cost card from the deck when needed.
  ensureOpener(game, 'player', rng);
  ensureOpener(game, 'ai', rng);
  startTurn(game, first);
  pushLog(game, 'The duel begins. Ember Court, turn 1.');
  return game;
}

function ensureOpener(game, who, rng) {
  const side = game[who];
  if (side.hand.some((id) => cardById(id).cost === 1)) return;
  const deckIndex = side.deck.findIndex((id) => cardById(id).cost === 1);
  if (deckIndex === -1) return;
  const handIndex = Math.floor(rng() * side.hand.length);
  const oneCost = side.deck.splice(deckIndex, 1)[0];
  side.deck.push(side.hand[handIndex]);
  side.hand[handIndex] = oneCost;
}

export function pushLog(game, text) {
  game.log.push(text);
  if (game.log.length > 5) game.log.shift();
}

export function drawCard(game, who) {
  const side = game[who];
  if (side.deck.length === 0) {
    side.life -= FATIGUE_DAMAGE;
    pushLog(game, `${who === 'player' ? 'You' : 'The Warden'} draw from an empty deck: fatigue ${FATIGUE_DAMAGE}.`);
    checkEnd(game);
    return null;
  }
  const id = side.deck.pop();
  if (side.hand.length >= HAND_LIMIT) {
    side.discard.push(id);
    pushLog(game, `${who === 'player' ? 'Your' : "The Warden's"} hand is full — ${cardById(id).name} burns.`);
    return null;
  }
  side.hand.push(id);
  return id;
}

function startTurn(game, who) {
  const side = game[who];
  side.maxMana = Math.min(MAX_MANA, side.maxMana + 1);
  side.mana = side.maxMana;
  side.surgeElement = null;
  drawCard(game, who);
}

/** Damage after shield; pierce ignores shield. Returns life damage dealt. */
function dealDamage(game, who, amount, pierce) {
  const side = game[who];
  let remaining = amount;
  if (!pierce && side.shield > 0) {
    const blocked = Math.min(side.shield, remaining);
    side.shield -= blocked;
    remaining -= blocked;
  }
  side.life -= remaining;
  checkEnd(game);
  return remaining;
}

/**
 * Play a card from `who`'s hand. Returns the play event, or null when the
 * card cannot be played (not in hand, not enough mana, wrong turn, game over).
 */
export function playCard(game, who, cardId) {
  if (game.phase === 'over') return null;
  if (game.active !== who) return null;
  const side = game[who];
  const foe = game[who === 'player' ? 'ai' : 'player'];
  const index = side.hand.indexOf(cardId);
  if (index === -1) return null;
  const card = cardById(cardId);
  if (side.mana < card.cost) return null;

  side.hand.splice(index, 1);
  side.discard.push(cardId);
  side.mana -= card.cost;
  side.cardsPlayed += 1;

  const adv = advantageBonus(card.element, foe.lastElement);
  const surge = side.surgeElement === card.element;
  let attack = card.attack + adv + (surge ? 2 : 0);
  side.surgeElement = card.element;
  side.lastElement = card.element;

  const pierce = card.effect === 'pierce';
  const dealt = dealDamage(game, who === 'player' ? 'ai' : 'player', attack, pierce);
  if (card.effect === 'drain') {
    const healed = Math.floor(dealt / 2);
    side.life = Math.min(MAX_LIFE, side.life + healed);
    side.healed += healed;
  }
  if (card.effect === 'heal') {
    side.life = Math.min(MAX_LIFE, side.life + 3);
    side.healed += 3;
  }
  if (card.effect === 'shield') side.shield += 4;
  side.damageDealt += dealt;

  const event = {
    who, card: cardId, attack, advantage: adv, surge, pierce,
    dealt, effect: card.effect, over: game.phase === 'over', winner: game.winner,
  };
  game.lastPlayed = event;
  const whoName = who === 'player' ? 'You play' : 'Warden plays';
  let line = `${whoName} ${card.name} (${attack} dmg${adv ? ', +2 element' : ''}${surge ? ', SURGE +2' : ''}${pierce ? ', pierce' : ''})`;
  if (card.effect === 'draw') line += ' — draw 1';
  if (card.effect === 'heal') line += ' — heal 3';
  if (card.effect === 'shield') line += ' — shield 4';
  if (card.effect === 'drain') line += ' — drain';
  pushLog(game, line);
  if (card.effect === 'draw') drawCard(game, who);
  return event;
}

/** All cards `who` can afford right now, in hand order. */
export function playableCards(game, who) {
  const side = game[who];
  return side.hand.filter((id) => cardById(id).cost <= side.mana);
}

export function endTurn(game) {
  if (game.phase === 'over') return false;
  if (game.active !== 'player') return false;
  game.active = 'ai';
  game.phase = 'ai';
  startTurn(game, 'ai');
  pushLog(game, 'The Warden takes the table.');
  return true;
}

/** Hand the table back to the player after the AI's turn. */
export function beginPlayerTurn(game) {
  if (game.phase === 'over') return false;
  game.turn += 1;
  game.active = 'player';
  game.phase = 'play';
  startTurn(game, 'player');
  pushLog(game, `Turn ${game.turn} — your move.`);
  return true;
}

function checkEnd(game) {
  if (game.phase === 'over') return;
  if (game.player.life <= 0 && game.ai.life <= 0) {
    game.winner = game.player.life === game.ai.life ? 'draw' : (game.player.life > game.ai.life ? 'player' : 'ai');
  } else if (game.ai.life <= 0) {
    game.winner = 'player';
  } else if (game.player.life <= 0) {
    game.winner = 'ai';
  }
  if (game.winner) {
    game.phase = 'over';
    game.player.life = Math.max(0, game.player.life);
    game.ai.life = Math.max(0, game.ai.life);
    pushLog(game, game.winner === 'player' ? 'Victory! The Ember Court is yours.' : 'The Warden takes the court.');
  }
}

/** Cards in hand that `who` could play, cheapest first — shared by UI hints. */
export function affordableSorted(game, who) {
  return playableCards(game, who)
    .map((id) => cardById(id))
    .sort((a, b) => a.cost - b.cost || b.attack - a.attack);
}
