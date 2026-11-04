# Drawn interface icons instead of emoji (owner 11-04: "looks less AI built")

One line-icon set everywhere: Lucide (already the app's icon set, ~50 icons in 40 files; ISC licence, notice on the
credits page). React app: `import { Play } from 'lucide-react'` + `<Play className="w-5 h-5" aria-hidden="true" />`.
Static pages + games: the sprite `public/icons.svg` (scripts/build-icon-sprite.mjs; symbols `i-<lucide-name>`):

    <svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-play"/></svg>

Games: `CDE_IC('play')` (public/games/cde-l10n.js) returns that markup — for innerHTML sinks only.

## Map (emoji → Lucide name)
▶ play · 🔊 volume-2 · 🔇 volume-x · ↺ 🔄 rotate-ccw / refresh-cw · 🔁 repeat · 🏆 trophy · ★ ⭐ (as a UI label) star ·
⚡ zap · 🏠 house · ⚒ 🔨 hammer · 🛡 shield · ➜ → arrow-right (← arrow-left in Hebrew) · ⬆ arrow-up · 🎮 gamepad-2 ·
✓ ✅ check / circle-check · ✗ ❌ ✕ x / circle-x · 💥 circle-x · 🎧 headphones · 👂 ear · 📦 package · 🤖 wand-sparkles ·
💡 lightbulb · ✨ 🌟 sparkles · 🔤 type · 🧲 magnet · 🖼 📸 image / camera · 🌈 rainbow · 🌳 🌿 trees · 🐾 paw-print ·
🍎 apple · 🚗 car · 👕 shirt · 🎨 palette · 📜 scroll · ⏳ hourglass · ⚠ triangle-alert · 💨 wind · 🔥 flame ·
🔎 🔍 search · ✏ pencil · 📝 notebook-pen · 🎉 party-popper · 📖 book-open · 📚 library · 🖨 printer · 🎲 dices ·
📌 pin · 🐢 turtle · 🎒 backpack · 🧩 puzzle · ⚔ swords · 📽 projector · 📋 clipboard-list · 📄 file-text · 🗺 map ·
👆 pointer · 🎴 layers · 🔒 lock · 📱 smartphone · 🏷 tag · 🎵 music · 🚀 rocket · 🎯 target · ⏱ timer · 🏅 medal ·
👑 crown · 🎁 gift · 😊 smile · 👥 users · 🧠 brain.  Missing a fitting one? List it in your report — don't edit the sprite.

## Keep (content, not interface chrome)
- Player avatars kids pick (🦊 🐱 🦁 …) and anything stored in a player's data.
- Emoji drawn INTO a game canvas as game art (fillText on a canvas), and the ⭐/☆ stars a child EARNS on a level card.
- Text characters that are typography, not icons: "·", "—", "×" in "COMBO ×3", "+16".

## Rules
- Words stay exactly as they are; only the emoji goes (and its now-double space). Same in en / he / es tables.
- An icon is decoration: `aria-hidden`. A control that was emoji-only (🔊 / 🔇) keeps or gets an `aria-label`.
- Direction: in Hebrew strings the "next" arrow is arrow-left (the tables already use ← there).
- Sinks: icon markup only where the string goes to innerHTML. A textContent sink: switch it to innerHTML ONLY if
  the whole string is our own static text; anything carrying a word/name/score must be escaped or the icon put in
  its own element. Never inject player names or word data unescaped.
- Static pages: CSP allows inline style and same-origin `<use href="/icons.svg#…">`; no inline script.
