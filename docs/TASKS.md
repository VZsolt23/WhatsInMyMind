# Feladatbontás

Haladási sorrend: M0 → M10. Minden mérföldkő végén a `lint`, `test` és `build` hibamentes. A feladatok mellett **kész-kritérium** (DoD) van. Jelölés: `[ ]` nyitott, `[x]` kész.

## M0 – Projekt alapok ✅

- [x] Vite + React + TypeScript (strict) projekt létrehozása a repó gyökerében (Yarn)
- [x] ESLint, Prettier, Vitest + Testing Library beállítása; `package.json` szkriptek
- [x] Mappaszerkezet és `@/` útvonal-alias ([ARCHITECTURE.md](ARCHITECTURE.md))
- [x] `netlify.toml`, `index.html` (téma-inicializáló inline script), favicon
- [ ] Commit (kérésre)

DoD: `yarn dev` és `yarn build` fut.

## M1 – Idő és tárolás alapok ✅

- [x] `lib/dayKey.ts`: `todayKey`, `daysBetween`, `addDays`, `msUntilNextDay` + tesztek (hónap/év határ, szökőév, DST)
- [x] `storage/`: biztonságos olvasás/írás, memória-tartalék, sémavalidáció, migrációs lépések
- [x] `settings`, `meta` kulcsok és típusok
- [x] `storage` esemény kezelés (több lap)

## M2 – Játéklogika (UI nélkül) ✅

- [x] `game/feedback.ts`: kétmenetes kiértékelés, duplikált betűk (`APPLE`/`PAPAL` teszt)
- [x] `game/config.ts`, `game/attempts.ts` (`getMaxAttempts`)
- [x] `puzzles/schema.ts` típusok + futásidejű validáció
- [x] `game/board.ts` + `game/progress.ts`: rácsmodell, metszések, zárolás, számozás
- [x] `game/reducer.ts`: gépelés, beküldés, kijelölés, előre kitöltött zárolt betűk, győzelem/vereség, több lapos `sync`
- [x] `game/share.ts`: spoilermentes megosztó szöveg

## M3 – Rejtvények és napi kiválasztás ✅

- [x] `scripts/validate-puzzles.ts` + `puzzles/validate.ts`, bekötve a buildbe
- [x] `puzzles/daily.ts`: sorszám → rejtvény, körbeforgatás, indulás előtti napok
- [x] Validátor tesztek (hibás rácsok, duplikátumok, minimum)

## M4 – Játék felület ✅

- [x] `themes/tokens.css`, `global.css`, `fonts.css` (JetBrains Mono, preload)
- [x] Alap komponensek: `Button`, `Icon`, `Modal` (fókuszcsapda, Esc), `Toast`, `GuessRow`, `Keyboard`
- [x] `SingleBoard`: tippsorok, kifejezések szóközzel, flip- és rázásanimáció
- [x] `GridBoard`: rács, szókijelölés (cella / szógomb, metszésen irányváltás), előre kitöltött betűk, tipptörténet
- [x] Fizikai és virtuális billentyűzet, billentyű-állapotszínek
- [x] Mentés minden változás után, visszatöltés frissítéskor
- [x] Végeredmény-panel: eredmény, megoldás(ok), megosztás, visszaszámláló
- [ ] Rácsban nyíl-billentyűs navigáció a szavak között (most: Tab a szógombokra + Space/Enter)

## M5 – Streak és statisztika ✅

- [x] `features/streak/stats.ts`: szabályok ([STORAGE_AND_TIME.md](STORAGE_AND_TIME.md)), idempotens rögzítés, tesztek
- [x] Statisztika modál (streak, győzelmi arány, eloszlás a mai eredmény kiemelésével, rácsos győzelmek)
- [x] Napváltás-észlelés futó appban (30 mp + `visibilitychange`/`focus`)
- [x] Óra-manipuláció védelem (`lastSeenDay` + figyelmeztető sáv)

## M6 – Témák

- [x] Dark téma tokenek, `system` követése (`prefers-color-scheme` változásra is)
- [x] Beállítások modál: témaválasztó, csökkentett mozgás, mentés
- [x] Villanásmentes téma-inicializálás (inline script)
- [x] Retro 98 téma: bevel keretek, címsor-gradiens, Tahoma, ablak-vezérlők, státuszsor ([THEMES.md](THEMES.md))
- [ ] Kontraszt-ellenőrzés mérőeszközzel mindhárom témában (WCAG AA)

## M7 – Achievementek ✅

- [x] 13 definíció és `evaluateAchievements` ([ACHIEVEMENTS.md](ACHIEVEMENTS.md)) + pozitív/negatív tesztek
- [x] Események bekötése (`gameEnded`, `themeChanged`)
- [x] Mentés, megszerzés-toast, Achievements modál

## M8 – Tartalom: 30 rejtvény (angol)

- [x] 30 rejtvény (20 single, 10 grid), nehézség a `note` mezőben
- [x] Mind átmegy a validátoron, a build 30-as minimumot követel
- [ ] Játékpróba és nehézség-hangolás (emberi tesztelők), szükség esetén `maxAttempts` vagy `clue` finomítása

## M9 – Súgó, minőség, megjelenés

- [x] „How to play" súgó (első indításkor automatikusan)
- [x] i18n szótár, minden felületi szöveg onnan jön (`en`)
- [x] ErrorBoundary, hiányzó rejtvény / nem elérhető tárolás üzenetei
- [x] Elérhetőség alapjai: billentyűzet, `aria-label`-ek, `aria-live`, nem csak színnel jelzett állapot
- [x] Méretkeret: JS ≈ 86 KB gzip (< 150 KB)
- [ ] Lighthouse-mérés (accessibility ≥ 95)
- [ ] Open Graph meta tagek, megosztási kép, PWA-manifest (opcionális)

## M10 – Kiadás

- [ ] `LAUNCH_DATE` beállítása a valódi indulási napra (`src/game/config.ts`)
- [ ] Netlify telepítés (git-alapú vagy kézi deploy)
- [ ] Éles ellenőrzés valódi mobilon és asztali gépen, mindhárom témával
- [ ] README frissítése, verziócímke (`v1.0.0`)

## M11 – Második kör: magyar nyelv (később)

- [ ] `hu` szótár (`Messages` típus), magyar ábécé és billentyűzet (ékezetes betűk)
- [ ] `hu.json` rejtvények (30+), magyar szójátékos kategóriák (pl. *Aputest*)
- [ ] Nyelvválasztó a beállításokban; döntés: közös vagy nyelvenkénti streak/statisztika
- [ ] Validátor kiterjesztése a magyar karakterekre (most `A–Z`)

## Később (ötletek, nem része az első kiadásnak)

- Újabb játék a WhatsInMyMind névtér alatt
- XP-stílusú külön legacy téma
- Streak-fagyasztás, archívum a korábbi napokhoz
- Hang, magas kontrasztú mód
