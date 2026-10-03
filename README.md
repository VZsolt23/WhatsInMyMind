# WhatsInMyMind

Napi szókitalálós játék a Szerencsekerék kategória-utalásaiból és a Wordle visszajelzési logikájából építkezve. Naponta egy rejtvény jut: egy kategória alapján kell kitalálni a rejtett szót, kifejezést, vagy egy keresztrejtvény-rács szavait.

> Az app neve nem kötődik egyetlen játékmódhoz: később más szavas játékok is kerülhetnek bele.

## A játék

- **Napi rejtvény:** egy adott napon mindenkinek ugyanaz, naponta egy játék. Új rejtvény helyi idő szerint éjfélkor.
- **Kategória mint egyetlen segítség:** szójáték, körülírás vagy téma (pl. *„Kicsit már puhány"* → *Aputest*; angolul *„A bit out of shape these days"* → *Dad bod*). Előre megadott betű nincs.
- **Wordle-visszajelzés:** zöld = jó helyen, sárga = benne van, de máshol, szürke = nincs benne. A színek mellett jelölés is mutatja az állapotot.
- **Két mód:**
  - **Egyszavas:** egy szó vagy kifejezés, klasszikus Wordle-tippelés.
  - **Rácsos:** 3–5 szó egy keresztrejtvény-rácsban. A kijelölt szót kell beírni; a megfejtett betűk a keresztező szavakban is megjelennek. A tippek az egész rácsra közösek.
- **Tippkorlát:** a rejtvény méretétől függ (egyszavasnál 6–8, rácsnál 6–10).
- **Streak, statisztika, 13 achievement**, spoilermentes megosztás (emoji-rács).
- **Témák:** világos, sötét és **Retro 98** (Windows 98/XP hangulat). A választás a böngészőben tárolódik.

Minden adat csak a játékos böngészőjében (localStorage) van: nincs backend, nincs fiók, nincs analitika.

## Fejlesztés

Követelmény: Node 22, Yarn 1.

```bash
yarn install
```

```bash
yarn dev
```

További parancsok (`build`, `test`, `lint`, `format`, `validate`, `coverage`): [CLAUDE.md](CLAUDE.md).

## Telepítés (Netlify)

A beállítások a [netlify.toml](netlify.toml)-ban vannak (build: `yarn build`, kimenet: `dist`, Node 22, SPA-átirányítás, cache-fejlécek).

1. Netlify → **Add new site → Import an existing project → GitHub** → `VZsolt23/WhatsInMyMind`.
2. A build-beállításokat a `netlify.toml`-ból veszi, nem kell semmit átírni → **Deploy**.
3. Utána minden `master`-re pusholt commit automatikusan új telepítést indít.

A build a rejtvényfájlokat is ellenőrzi; hibás rejtvénnyel nem települ.

> Az 1. rejtvény napja (`LAUNCH_DATE` a [src/game/config.ts](src/game/config.ts)-ben) **2026-10-03**. Kiadás után ne változtasd: a rejtvények sorszáma és a játékosok mentett játékai ehhez igazodnak.

## Tartalom

30 angol rejtvény (20 egyszavas, 10 rácsos) a [src/puzzles/en.json](src/puzzles/en.json)-ban, naponta egy, a lista végén elölről kezdve. Új rejtvényt a lista **végére** kell fűzni; a formátum és a szabályok: [docs/PUZZLE_FORMAT.md](docs/PUZZLE_FORMAT.md).

## Állapot

- **v1.0.0:** angol nyelvű első kiadás.
- **Következő:** magyar nyelv (külön magyar rejtvények, ékezetes billentyűzet, nyelvenként külön streak és statisztika).

A teljes feladatlista: [docs/TASKS.md](docs/TASKS.md).

## Dokumentáció

Fejlesztési szabályok: [CLAUDE.md](CLAUDE.md). Részletek a [docs/](docs/) mappában:

- [GAME_RULES.md](docs/GAME_RULES.md): játékszabályok, visszajelzés, tippkorlát, vezérlés
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): technológia, mappaszerkezet, adatfolyam
- [PUZZLE_FORMAT.md](docs/PUZZLE_FORMAT.md): rejtvény JSON, szerkesztési szabályok, validátor
- [STORAGE_AND_TIME.md](docs/STORAGE_AND_TIME.md): localStorage séma, napkezelés, streak
- [ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md): achievementek
- [THEMES.md](docs/THEMES.md): témák, design tokenek, kontraszt
- [CODING_STANDARDS.md](docs/CODING_STANDARDS.md): konvenciók, tesztelés, git

## Licenc

A JetBrains Mono betűtípus a SIL Open Font License 1.1 alatt használható ([public/fonts/OFL.txt](public/fonts/OFL.txt)).
