# Feladatbontás

Haladási sorrend: M0 → M10. Minden mérföldkő végén a `lint`, `test` és `build` hibamentes. A feladatok mellett **kész-kritérium** (DoD) van. Jelölés: `[ ]` nyitott, `[x]` kész.

## M0 – Projekt alapok

- [ ] Vite + React + TypeScript (strict) projekt létrehozása a repó gyökerében
- [ ] ESLint, Prettier, Vitest + Testing Library beállítása; `package.json` szkriptek (`dev`, `build`, `test`, `lint`, `validate`)
- [ ] Mappaszerkezet a [ARCHITECTURE.md](ARCHITECTURE.md) szerint (üres modulok, útvonal-aliasok)
- [ ] `netlify.toml`, `index.html` (téma-inicializáló inline script helye), favicon
- [ ] Első commit (`chore: scaffold project`)

DoD: `npm run dev` és `npm run build` fut, egy üres „WhatsInMyMind" oldal látszik.

## M1 – Idő és tárolás alapok

- [ ] `lib/dayKey.ts`: `todayKey`, `daysBetween`, `addDays` + tesztek (hónap/év határ, szökőév, DST)
- [ ] `storage/`: biztonságos olvasás/írás, memória-tartalék, sémavalidáció, `migrations.ts` váz
- [ ] `settings`, `meta` kulcsok és típusok
- [ ] `storage` esemény kezelés (több lap)

DoD: sérült/hiányzó/tiltott localStorage mellett sem omlik össze; tesztek zöldek.

## M2 – Játéklogika (UI nélkül)

- [ ] `game/feedback.ts`: kétmenetes kiértékelés, duplikált betűk (`APPLE`/`PAPAL` teszt)
- [ ] `game/config.ts`, `game/attempts.ts` (`getMaxAttempts`)
- [ ] `puzzles/schema.ts` típusok + futásidejű validáció
- [ ] `game/grid.ts`: rácsmodell, metszések, zárolás, szó-kijelölés, előre kitöltött zárolt betűk
- [ ] `game/reducer.ts`: tipp beküldése (egyszavas és rácsos), érvénytelen tipp, győzelem/vereség állapot
- [ ] `game/share.ts`: spoilermentes megosztó kártya

DoD: egy teljes játék végigjátszható tesztből (single és grid), lefedettség ≥ 90%.

## M3 – Rejtvények és napi kiválasztás

- [ ] `scripts/validate-puzzles.ts` validátor (szabályok: [PUZZLE_FORMAT.md](PUZZLE_FORMAT.md)), bekötve a buildbe
- [ ] `puzzles/daily.ts`: dayNumber → puzzle, körbeforgatás, jövő/múlt határesetek
- [ ] 5 próba-rejtvény (3 single, 2 grid) a fejlesztéshez
- [ ] Validátor tesztek (hibás példafájlok)

DoD: `npm run validate` zöld a próba-rejtvényekkel, hibás fájlra elbukik.

## M4 – Játék felület (modern, világos)

- [ ] `themes/tokens.css` (light alap) + globális stílus
- [ ] `themes/fonts.css`: JetBrains Mono `@font-face` (`public/fonts`), preload (az `OFL.txt` és `AUTHORS.txt` már a `public/fonts/`-ban van)
- [ ] Alap komponensek: `Button`, `Modal`, `Toast`, `Tile`, `Keyboard`
- [ ] `SingleBoard`: beviteli sor, tippek rácsa, animációk, hibás tipp visszajelzés
- [ ] `GridBoard`: rács, szókijelölés (koppintás/nyilak), előre kitöltött zárolt betűk, metszések
- [ ] Fizikai és virtuális billentyűzet, billentyű-állapotszínek
- [ ] Játékállapot mentése/betöltése minden tipp után
- [ ] Játék vége nézet: eredmény, megoldás, megosztás gomb

DoD: egy nap játékállapota frissítés után is megmarad, mobilon és asztali gépen is játszható.

## M5 – Streak és statisztika

- [ ] `features/streak`: szabályok [STORAGE_AND_TIME.md](STORAGE_AND_TIME.md) szerint + tesztek az összes esetre
- [ ] `stats` mentése, tippeloszlás
- [ ] Statisztika modál (streak, győzelmi arány, eloszlás)
- [ ] Napváltás-észlelés futó appban (időzítő + `visibilitychange`)
- [ ] Óra-manipuláció védelem (`lastSeenDay`)

DoD: a teszt minden streak-forgatókönyvet lefed, éjfélkori váltás működik.

## M6 – Témák

- [ ] Dark téma tokenek, `system` követése
- [ ] Beállítások modál: témaválasztó, mentés
- [ ] Villanásmentes téma-inicializálás (inline script)
- [ ] Legacy (Win98/XP) téma: bevel keretek, címsor-gradiens, Tahoma, státuszsor ([THEMES.md](THEMES.md))
- [ ] Kontraszt- és elérhetőség-ellenőrzés mindhárom témában

DoD: a három téma vizuálisan teljes, a választás újratöltés után is megmarad.

## M7 – Achievementek

- [ ] Definíciók és `evaluate` ([ACHIEVEMENTS.md](ACHIEVEMENTS.md)) + tesztek
- [ ] Események bekötése (`GAME_WON`, `GAME_LOST`, `THEME_CHANGED`)
- [ ] Mentés, megszerzés-toast, Achievements modál

DoD: mind a 13 achievement tesztelt, a megszerzettek tartósak.

## M8 – Tartalom: 30 rejtvény (angol)

- [ ] 30 rejtvény megírása (~20 single, ~10 grid), nehézség-keverés ([PUZZLE_FORMAT.md](PUZZLE_FORMAT.md))
- [ ] Mind átmegy a validátoron
- [ ] Játékpróba és nehézség-hangolás, szükség esetén `maxAttempts` finomítása

DoD: 30 érvényes rejtvény, nincs duplikált megoldás.

## M9 – Súgó, minőség, megjelenés

- [ ] „How to play" súgó (első indításkor automatikusan)
- [ ] i18n szótár előkészítése, minden szöveg onnan jön (`en`)
- [ ] ErrorBoundary, üres/hibaállapotok
- [ ] Elérhetőség átnézése (billentyűzet, screen reader, `aria-live`)
- [ ] Meta/OG tagek, favicon, PWA-manifest (opcionális)
- [ ] Teljesítmény: méretkeret ellenőrzése

DoD: Lighthouse accessibility ≥ 95, JS < 150 KB gzip.

## M10 – Kiadás

- [ ] Netlify telepítés (git-alapú vagy kézi deploy), `LAUNCH_DATE` beállítása
- [ ] Éles ellenőrzés mobilon és asztali gépen, mindhárom témával
- [ ] README frissítése, verziócímke (`v1.0.0`)

## M11 – Második kör: magyar nyelv (később)

- [ ] `hu` szótár, magyar ábécé és billentyűzet (ékezetes betűk)
- [ ] `hu.json` rejtvények (30+), magyar szójátékos kategóriák (pl. *Aputest*)
- [ ] Nyelvválasztó a beállításokban, nyelvenként külön napi rejtvény és statisztika/streak kezelése (döntés kell: közös vagy nyelvenkénti streak)
- [ ] Validátor kiterjesztése a magyar karakterekre

## Később (ötletek, nem része az első kiadásnak)

- Újabb játék a WhatsInMyMind névtér alatt
- XP-stílusú külön legacy téma
- Streak-fagyasztás, archívum a korábbi napokhoz
- Hang, magas kontrasztú mód
