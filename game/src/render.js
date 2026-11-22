// Ember Court — the table. Builds the DOM for the title screen, the duel
// table (opponent hand, played cards, player hand, life and mana totals) and
// the win / loss screens, and animates every play: cards slide and flip,
// damage floats up, the hero shakes on a big hit, victory lands with gold.
import { ELEMENTS, EFFECT_LABEL, cardById } from './cards.js';
import { MAX_LIFE } from './engine.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const $ = (id) => document.getElementById(id);

function elementBadge(element) {
  const el = ELEMENTS[element];
  return `<span class="el-badge" style="--el:${el.color};--eld:${el.dark}">${el.glyph} ${el.name}</span>`;
}

function cardHtml(card, opts = {}) {
  const el = ELEMENTS[card.element];
  const effect = EFFECT_LABEL[card.effect];
  const playable = opts.playable ? ' playable' : '';
  const selected = opts.selected ? ' selected' : '';
  const small = opts.small ? ' small' : '';
  return `<div class="card el-${card.element}${playable}${selected}${small}" data-card="${card.id}"
      style="--el:${el.color};--eld:${el.dark}" tabindex="0" role="button"
      aria-label="${card.name}, cost ${card.cost}, attack ${card.attack}, ${el.name}">
    <div class="card-cost">◆ ${card.cost}</div>
    <div class="card-glyph">${el.glyph}</div>
    <div class="card-attack">${card.attack}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-element">${el.name.toUpperCase()}</div>
    ${effect ? `<div class="card-effect">${effect}</div>` : '<div class="card-effect none">—</div>'}
    <div class="card-text">${card.text}</div>
  </div>`;
}

function cardBackHtml() {
  return `<div class="card card-back"><div class="card-back-glyph">♛</div><div class="card-back-text">EMBER<br>COURT</div></div>`;
}

function manaPips(maxMana, mana) {
  let pips = '';
  for (let i = 0; i < 10; i += 1) {
    const filled = i < mana ? ' full' : '';
    const unlocked = i < maxMana ? '' : ' locked';
    pips += `<span class="pip${filled}${unlocked}">◆</span>`;
  }
  return pips;
}

function heroHtml(who, side, label) {
  const pct = Math.max(0, (side.life / MAX_LIFE) * 100);
  return `<div class="hero" id="hero-${who}">
    <div class="hero-name">${label}</div>
    <div class="hero-life"><span class="heart">❤</span> <span class="life-num">${side.life}</span><span class="life-max">/${MAX_LIFE}</span></div>
    <div class="life-bar"><div class="life-fill" style="width:${pct}%"></div></div>
    ${side.shield > 0 ? `<div class="hero-shield">🛡 Shield ${side.shield}</div>` : ''}
    <div class="hero-mana">${manaPips(side.maxMana, side.mana)}<span class="mana-num">${side.mana}/${side.maxMana}</span></div>
    <div class="hero-deck">Deck ${side.deck.length} · Played ${side.cardsPlayed}</div>
  </div>`;
}

export function renderTable(game, ui) {
  const app = $('app');
  const last = game.lastPlayed;
  const lastCard = last ? cardById(last.card) : null;
  const oppHand = game.ai.hand.map(() => cardBackHtml()).join('');
  const myHand = game.player.hand
    .map((id) => cardHtml(cardById(id), {
      playable: game.phase === 'play' && game.active === 'player' && cardById(id).cost <= game.player.mana,
      selected: ui.selected === id,
    }))
    .join('');
  const logLines = game.log.slice(-4).map((line) => `<div class="log-line">${line}</div>`).join('');
  const turnLabel = game.phase === 'over'
    ? (game.winner === 'player' ? 'VICTORY' : game.winner === 'ai' ? 'DEFEAT' : 'DRAW')
    : game.active === 'player' ? 'YOUR TURN' : 'WARDEN THINKING…';
  const hint = game.phase === 'play'
    ? 'Click a glowing card to play it · keys 1–7 select, Enter plays, E ends turn'
    : game.phase === 'ai' ? 'The Warden is choosing…' : '';

  app.innerHTML = `
  <div class="table">
    <header class="topbar">
      <div class="brand">♛ EMBER COURT</div>
      <div class="turn-pill">${turnLabel} · TURN ${game.turn}</div>
      <div class="top-actions">
        <button class="mini-btn" id="btn-how">How to play</button>
        <button class="mini-btn" id="btn-mute">${ui.muted ? '🔇 Muted' : '🔊 Sound'}</button>
        <button class="mini-btn" id="btn-restart">↻ Restart</button>
      </div>
    </header>
    <div class="side opponent-side">
      ${heroHtml('ai', game.ai, 'WARDEN OF CINDERS')}
      <div class="hand opp-hand">${oppHand}</div>
    </div>
    <div class="middle">
      <div class="played-zone" id="played-zone">
        ${lastCard ? `<div class="played-label">LAST PLAYED ${last.who === 'player' ? '· YOU' : '· WARDEN'}</div>${cardHtml(lastCard, { small: true })}<div class="played-dmg">−${last.attack} ${last.surge ? '· SURGE!' : ''}${last.advantage ? ' · +2 ELEMENT' : ''}</div>` : '<div class="played-empty">No card played yet — play the first card of the duel.</div>'}
      </div>
      <div class="log" id="game-log">${logLines}</div>
    </div>
    <div class="side player-side">
      <div class="hand my-hand">${myHand}</div>
      ${heroHtml('player', game.player, 'YOU · EMBER CHAMPION')}
    </div>
    <footer class="bottombar">
      <div class="hint">${hint}</div>
      <button class="end-btn" id="btn-end" ${game.phase === 'play' ? '' : 'disabled'}>END TURN ⏎</button>
    </footer>
    <div class="legend">
      <span><i class="sw" style="background:#e8483f">▲</i> Flame beats Leaf</span>
      <span><i class="sw" style="background:#3fae5a">◆</i> Leaf beats Tide</span>
      <span><i class="sw" style="background:#2f8fe8">●</i> Tide beats Flame</span>
      <span><i class="sw" style="background:#d9a441">■</i> Stone: neutral, sturdy</span>
      <span>Same element twice in a turn = <b>SURGE +2</b></span>
    </div>
  </div>
  <div class="overlay hidden" id="how-overlay">
    <div class="panel how-panel">
      <h2>How to play Ember Court</h2>
      <p><b>Goal:</b> reduce the Warden of Cinders from 30 ❤ to 0 before yours reaches 0.</p>
      <p><b>Each turn:</b> gain +1 mana crystal (max 10) and draw 1 card. Play as many cards as your mana allows, then End Turn.</p>
      <p><b>Cards:</b> ◆ cost (top left) · big number = damage to the Warden · glyph + colour = element. Shield 🛡 blocks damage first; Pierce ignores shield; Drain heals you for half the damage.</p>
      <p><b>Elements:</b> Flame ▲ beats Leaf ◆, Leaf beats Tide ●, Tide beats Flame. Playing against the Warden's last element gives <b>+2 damage</b>.</p>
      <p><b>Surge:</b> play two cards of the same element in one turn — the second gets <b>+2 damage</b>.</p>
      <p><b>Empty deck?</b> Drawing from an empty deck deals 2 fatigue damage to you. Hand limit is 10.</p>
      <button class="big-btn" id="btn-close-how">Got it — back to the table</button>
    </div>
  </div>`;
}

export function renderTitle(best) {
  const app = $('app');
  app.innerHTML = `
  <div class="title-screen">
    <div class="title-emblem">♛</div>
    <h1 class="title-name">EMBER COURT</h1>
    <p class="title-tag">A duel of flame, tide, leaf &amp; stone — outplay the Warden, card by card.</p>
    <div class="title-cards">
      <div class="card el-flame" style="--el:#e8483f;--eld:#8f1d16"><div class="card-cost">◆ 4</div><div class="card-glyph">▲</div><div class="card-attack">6</div><div class="card-name">Flame Drake</div><div class="card-element">FLAME</div><div class="card-effect none">—</div><div class="card-text">Its shadow is smoke.</div></div>
      <div class="card el-tide" style="--el:#2f8fe8;--eld:#124a80"><div class="card-cost">◆ 6</div><div class="card-glyph">●</div><div class="card-attack">8</div><div class="card-name">Deep Leviathan</div><div class="card-element">TIDE</div><div class="card-effect">HEAL 3</div><div class="card-text">Heal 3. The old tide.</div></div>
      <div class="card el-leaf" style="--el:#3fae5a;--eld:#17602e"><div class="card-cost">◆ 6</div><div class="card-glyph">◆</div><div class="card-attack">8</div><div class="card-name">Elder Oak</div><div class="card-element">LEAF</div><div class="card-effect">SHIELD 4</div><div class="card-text">Shield 4. Older than the court.</div></div>
    </div>
    <button class="big-btn play-btn" id="btn-play">▶ &nbsp;PLAY THE DUEL</button>
    <button class="ghost-btn" id="btn-how-title">How to play</button>
    <div class="title-foot">You 30 ❤ vs Warden 30 ❤ · 24 unique cards · 4 elements · best of wits, not luck alone${best ? ` · Best: won in ${best} turns` : ''}</div>
    <div class="title-legend">▲ Flame beats Leaf &nbsp;·&nbsp; ◆ Leaf beats Tide &nbsp;·&nbsp; ● Tide beats Flame &nbsp;·&nbsp; ■ Stone stands alone</div>
  </div>
  <div class="overlay hidden" id="how-overlay">
    <div class="panel how-panel">
      <h2>How to play Ember Court</h2>
      <p><b>Goal:</b> reduce the Warden of Cinders from 30 ❤ to 0 before yours reaches 0.</p>
      <p><b>Each turn:</b> gain +1 mana crystal (max 10) and draw 1 card. Play as many cards as your mana allows, then End Turn.</p>
      <p><b>Cards:</b> ◆ cost (top left) · big number = damage to the Warden · glyph + colour = element. Shield 🛡 blocks damage first; Pierce ignores shield; Drain heals you for half the damage.</p>
      <p><b>Elements:</b> Flame ▲ beats Leaf ◆, Leaf beats Tide ●, Tide beats Flame. Playing against the Warden's last element gives <b>+2 damage</b>.</p>
      <p><b>Surge:</b> play two cards of the same element in one turn — the second gets <b>+2 damage</b>.</p>
      <p><b>Empty deck?</b> Drawing from an empty deck deals 2 fatigue damage to you. Hand limit is 10.</p>
      <button class="big-btn" id="btn-close-how">Got it</button>
    </div>
  </div>`;
}

export function renderOver(game) {
  const won = game.winner === 'player';
  const app = $('app');
  app.innerHTML = `
  <div class="over-screen ${won ? 'win' : 'lose'}">
    <div class="over-emblem">${won ? '👑' : '🥀'}</div>
    <h1 class="over-title">${won ? 'VICTORY!' : 'DEFEAT'}</h1>
    <p class="over-sub">${won ? 'The Ember Court is yours. The Warden bows to a better hand.' : 'The Warden keeps the court — this time. Shuffle up and take it back.'}</p>
    <div class="over-stats">
      <div class="stat"><div class="stat-num">${game.turn}</div><div class="stat-label">TURNS</div></div>
      <div class="stat"><div class="stat-num">${game.player.cardsPlayed}</div><div class="stat-label">CARDS YOU PLAYED</div></div>
      <div class="stat"><div class="stat-num">${game.player.damageDealt}</div><div class="stat-label">DAMAGE DEALT</div></div>
      <div class="stat"><div class="stat-num">${game.player.life} ❤</div><div class="stat-label">LIFE LEFT</div></div>
    </div>
    <div class="over-final">
      <span>YOU ${game.player.life} ❤</span><span class="vs">vs</span><span>WARDEN ${game.ai.life} ❤</span>
    </div>
    <button class="big-btn play-btn" id="btn-again">↻ &nbsp;PLAY AGAIN</button>
    <button class="ghost-btn" id="btn-title">Back to title</button>
    ${won ? '<div class="confetti" id="confetti"></div>' : ''}
  </div>`;
  if (won) {
    const confetti = $('confetti');
    if (confetti) {
      const colors = ['#e8483f', '#2f8fe8', '#3fae5a', '#d9a441', '#f5d76e'];
      for (let i = 0; i < 60; i += 1) {
        const piece = document.createElement('i');
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 1.2}s`;
        piece.style.animationDuration = `${2 + Math.random() * 2}s`;
        confetti.appendChild(piece);
      }
    }
  }
}

/** A floating damage number over a hero. */
export function floatDamage(who, text, kind = 'dmg') {
  const hero = $(`hero-${who}`);
  if (!hero) return;
  const el = document.createElement('div');
  el.className = `floater ${kind}`;
  el.textContent = text;
  hero.appendChild(el);
  setTimeout(() => el.remove(), 1100);
  if (kind === 'dmg') {
    hero.classList.remove('shake');
    void hero.offsetWidth;
    hero.classList.add('shake');
  }
}

export { elementBadge };
