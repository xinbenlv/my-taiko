# 太閣立志伝 Web ⚔️
### Taikō Risshiden — A 2D Strategy Game

A browser-based strategy RPG inspired by Koei's classic **太閣立志伝** (Taikō Risshiden) series. Rise from a humble 足軽 (Ashigaru) to become 大名 (Daimyō) in Sengoku-era Japan.

**🎮 [Play Now →](https://my-taiko.vercel.app)**

---

## Screenshots

| Title Screen | Character Creation |
|:---:|:---:|
| ![Title Screen](screenshots/01-title-screen.webp) | ![Character Creation](screenshots/02-character-creation.webp) |

| Strategic Map | Action Menu |
|:---:|:---:|
| ![Game Map](screenshots/03-game-map.webp) | ![Action Menu](screenshots/04-action-menu.webp) |

| Combat System |
|:---:|
| ![Combat](screenshots/05-combat.webp) |

---

## Features

- 🏯 **10 Sengoku-era castles** — Kyoto, Osaka, Owari, Mikawa, Kai, Echigo, Mutsu, Sagami, Aki, Satsuma
- 🎭 **Character creation** with 4-stat allocation (武力 Martial / 知略 Intelligence / 魅力 Charm / 政治 Politics)
- ⚔️ **Rock-paper-scissors combat** — Attack > Skill > Defend, with stat bonuses
- 🗺️ **Pixel art map** of Japan with draggable/touch navigation
- 📋 **8 actions per turn**: Train, Visit, Duel, Diplomacy, Trade, Recruit, Rest, Travel
- 🎲 **Random events** — encounters with merchants, ninjas, sages, and nobles
- 📈 **Rank progression**: 足軽 → 侍 → 隊長 → 奉行 → 家老 → 城主 → 大名
- 💾 **LocalStorage save/load** — pick up where you left off

## Tech Stack

- Pure **HTML5 + CSS + vanilla JavaScript** — zero dependencies
- Canvas-rendered pixel art map
- Mobile-friendly (touch controls)
- Static hosting ready (Vercel, GitHub Pages, etc.)

## Run Locally

```bash
# Clone
git clone https://github.com/xinbenlv/my-taiko.git
cd my-taiko

# Serve (any static server works)
node server.js
# → http://localhost:3000

# Or simply open index.html in a browser
```

## License

MIT
