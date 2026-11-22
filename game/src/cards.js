// Ember Court — the card pool.
// Four elements, each with its own colour and shape so a card reads at a
// glance, never by text alone. Flame beats Leaf, Leaf beats Tide, Tide beats
// Flame; Stone is neutral and sturdy. Every card: a cost in mana crystals,
// an attack, and one effect word (or none).
export const ELEMENTS = {
  flame: { name: 'Flame', glyph: '▲', color: '#e8483f', dark: '#8f1d16', beats: 'leaf' },
  tide: { name: 'Tide', glyph: '●', color: '#2f8fe8', dark: '#124a80', beats: 'flame' },
  leaf: { name: 'Leaf', glyph: '◆', color: '#3fae5a', dark: '#17602e', beats: 'tide' },
  stone: { name: 'Stone', glyph: '■', color: '#d9a441', dark: '#7a5514', beats: null },
};

// effect: none | draw | heal | shield | pierce | drain
// draw: draw 1 card. heal: restore 3 life. shield: gain 4 shield (blocks damage).
// pierce: damage ignores shield. drain: heal yourself for half the damage dealt.
export const CARD_POOL = [
  { id: 'ember-imp', name: 'Ember Imp', element: 'flame', cost: 1, attack: 2, effect: 'none', text: 'A spark with teeth.' },
  { id: 'cinder-fox', name: 'Cinder Fox', element: 'flame', cost: 2, attack: 3, effect: 'none', text: 'Quick as a wildfire.' },
  { id: 'pyre-guard', name: 'Pyre Guard', element: 'flame', cost: 3, attack: 4, effect: 'shield', text: 'Shield 4. Stands in the flame.' },
  { id: 'flame-drake', name: 'Flame Drake', element: 'flame', cost: 4, attack: 6, effect: 'none', text: 'Its shadow is smoke.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', element: 'flame', cost: 6, attack: 8, effect: 'draw', text: 'Draw 1. Rises again.' },
  { id: 'wildfire', name: 'Wildfire', element: 'flame', cost: 5, attack: 7, effect: 'pierce', text: 'Pierce. Burns through shield.' },
  { id: 'ripple-sprite', name: 'Ripple Sprite', element: 'tide', cost: 1, attack: 2, effect: 'heal', text: 'Heal 3. Cool water.' },
  { id: 'tidecaller', name: 'Tidecaller', element: 'tide', cost: 2, attack: 3, effect: 'draw', text: 'Draw 1. Calls the deep.' },
  { id: 'frost-eel', name: 'Frost Eel', element: 'tide', cost: 3, attack: 4, effect: 'pierce', text: 'Pierce. Slips past guard.' },
  { id: 'coral-knight', name: 'Coral Knight', element: 'tide', cost: 3, attack: 4, effect: 'shield', text: 'Shield 4. Reef-hard armor.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', element: 'tide', cost: 6, attack: 8, effect: 'heal', text: 'Heal 3. The old tide.' },
  { id: 'storm-surge', name: 'Storm Surge', element: 'tide', cost: 5, attack: 7, effect: 'draw', text: 'Draw 1. The sea answers.' },
  { id: 'sproutling', name: 'Sproutling', element: 'leaf', cost: 1, attack: 2, effect: 'heal', text: 'Heal 3. Small and stubborn.' },
  { id: 'thorn-wolf', name: 'Thorn Wolf', element: 'leaf', cost: 2, attack: 3, effect: 'none', text: 'Runs where roots cannot.' },
  { id: 'briar-warden', name: 'Briar Warden', element: 'leaf', cost: 3, attack: 4, effect: 'shield', text: 'Shield 4. The hedge holds.' },
  { id: 'canopy-stag', name: 'Canopy Stag', element: 'leaf', cost: 4, attack: 6, effect: 'drain', text: 'Drain. Drinks the light.' },
  { id: 'elder-oak', name: 'Elder Oak', element: 'leaf', cost: 6, attack: 8, effect: 'shield', text: 'Shield 4. Older than the court.' },
  { id: 'vine-serpent', name: 'Vine Serpent', element: 'leaf', cost: 5, attack: 7, effect: 'draw', text: 'Draw 1. Coils and waits.' },
  { id: 'pebble-pup', name: 'Pebble Pup', element: 'stone', cost: 1, attack: 2, effect: 'shield', text: 'Shield 4. Harder than it looks.' },
  { id: 'granite-bear', name: 'Granite Bear', element: 'stone', cost: 3, attack: 5, effect: 'none', text: 'No tricks. Just weight.' },
  { id: 'quartz-owl', name: 'Quartz Owl', element: 'stone', cost: 2, attack: 3, effect: 'draw', text: 'Draw 1. Sees the whole table.' },
  { id: 'basalt-golem', name: 'Basalt Golem', element: 'stone', cost: 4, attack: 6, effect: 'shield', text: 'Shield 4. A walking wall.' },
  { id: 'mountain-king', name: 'Mountain King', element: 'stone', cost: 6, attack: 9, effect: 'none', text: 'The court bows to stone.' },
  { id: 'gold-vein', name: 'Gold Vein', element: 'stone', cost: 5, attack: 7, effect: 'drain', text: 'Drain. Riches that bite.' },
];

export const EFFECT_LABEL = {
  none: '',
  draw: 'DRAW 1',
  heal: 'HEAL 3',
  shield: 'SHIELD 4',
  pierce: 'PIERCE',
  drain: 'DRAIN',
};

/** A fresh 24-card deck: one of every card, shuffled with the given rng. */
export function buildDeck(rng) {
  const deck = CARD_POOL.map((card) => card.id);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardById(id) {
  return CARD_POOL.find((card) => card.id === id);
}

/** +2 attack when the played card's element beats the foe's last played element. */
export function advantageBonus(playedElement, foeLastElement) {
  if (!foeLastElement) return 0;
  return ELEMENTS[playedElement].beats === foeLastElement ? 2 : 0;
}
