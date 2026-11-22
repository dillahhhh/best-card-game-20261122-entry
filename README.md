# Ember Court

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/dillahhhh/best-card-game-20261122-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/dillahhhh/best-card-game-20261122-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original turn-based card duel for the [best-card-game-20261122-1826 bounty](https://make.fun/bounty/best-card-game-20261122-1826) on make.fun.

**Play it now:** https://dillahhhh.github.io/best-card-game-20261122-entry/game/

You are the Ember Champion. The Warden of Cinders holds the court, and only
a better hand takes it from her. Both sides start at 30 life with a 24-card
deck — one of every card — and gain +1 mana crystal each turn, up to 10.

## How to play

- **Goal:** reduce the Warden from 30 ❤ to 0 before yours reaches 0.
- **Each turn:** gain +1 mana and draw 1 card. Play as many cards as your mana allows, then End Turn.
- **Cards:** ◆ cost (top left) · big number = damage · glyph + colour = element. Shield 🛡 blocks damage first; Pierce ignores shield; Drain heals you for half the damage dealt; Draw and Heal do what they say.
- **Elements:** Flame ▲ beats Leaf ◆, Leaf beats Tide ●, Tide beats Flame. Playing against the Warden's last element gives **+2 damage**.
- **Surge:** play two cards of the same element in one turn — the second gets **+2 damage**.
- **Empty deck?** Drawing from an empty deck deals 2 fatigue damage. Hand limit is 10.
- **The Warden** is a greedy reader: she values damage per mana, chases the element advantage against your last card, banks shield when hurt, and holds her finisher for a lethal turn. Read her last card and counter it.

Controls: click a glowing card to play it (click again to confirm), keys 1–7 select, Enter plays, E ends turn, M mutes, R restarts.

## Build

Pure static files under `game/` — no network, no build step, no vendored
library. Sound is synthesized live with WebAudio. Serve locally with
`node serve.ts` and open http://localhost:8080.

Screenshots are real renders of the game's own code (`?shot=title|play|win|loss`
stages deterministic games from fixed seeds), captured in headless Chromium.

License: MIT.
