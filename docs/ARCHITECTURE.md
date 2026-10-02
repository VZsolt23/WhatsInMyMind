# Architektúra

## Technológiai verem

| Réteg | Választás | Indok |
|---|---|---|
| Keretrendszer | React 19 | kért |
| Build | Vite 8 | kért |
| Nyelv | TypeScript 6 (strict) | játéklogika biztonsága; a typescript-eslint még nem támogatja a TS 7-et |
| Csomagkezelő | Yarn 1 (classic) | kért; npm nem használható |
| Stílus | CSS Modules + CSS változók (design tokenek) | téma-váltás könyvtár nélkül |
| Állapot | `useReducer` + Context | kis app, nincs szükség külső könyvtárra |
| Teszt | Vitest + Testing Library (jsdom 26) | Vite-natív; a jsdom újabb verziói Node ≥ 22.22.2-t kérnek |
| Lint/formázás | ESLint 9 + Prettier | a `jsx-a11y` még nem támogatja az ESLint 10-et |
| Hosting | Netlify (statikus) | kért |
| Tárolás | localStorage | ingyenes, szerver nélkül |

Nincs router: egyoldalas app, a statisztika/achievement/beállítások/súgó modálokban nyílik.

## Mappaszerkezet

```
/
├─ docs/                       dokumentáció
├─ public/
│  ├─ favicon.svg
│  └─ fonts/                   JetBrains Mono woff2 (Regular, Medium, Bold) + OFL.txt + AUTHORS.txt
├─ scripts/
│  └─ validate-puzzles.ts      rejtvény-validátor (a build része)
├─ src/
│  ├─ game/                    TISZTA játéklogika, React és böngésző nélkül
│  │  ├─ config.ts             konstansok (LAUNCH_DATE, korlátok, tippképlet)
│  │  ├─ feedback.ts           kétmenetes betűkiértékelés
│  │  ├─ board.ts              tábla- és rácsmodell, cellák, számozás
│  │  ├─ progress.ts           tippekből számolt állapot (zárolt cellák, megoldott szavak)
│  │  ├─ attempts.ts           getMaxAttempts
│  │  ├─ reducer.ts            játék-állapotgép (gépelés, beküldés, kijelölés, sync)
│  │  └─ share.ts              spoilermentes megosztó szöveg
│  ├─ puzzles/
│  │  ├─ en.json               angol rejtvények (később hu.json)
│  │  ├─ schema.ts             típusok + szerkezeti ellenőrzés
│  │  ├─ validate.ts           rácsszabályok és listaellenőrzés (futásidő + build)
│  │  ├─ daily.ts              napi rejtvény kiválasztása
│  │  └─ index.ts              loadPuzzles(locale)
│  ├─ storage/
│  │  ├─ storage.ts            az egyetlen localStorage-hozzáférés: verzió, migráció, hibatűrés
│  │  └─ schemas.ts            settings és meta kulcs
│  ├─ lib/
│  │  └─ dayKey.ts             az egyetlen időforrás (helyi naptári nap)
│  ├─ features/
│  │  ├─ game/                 napi játék: mentés (gamesStore), napváltás (currentDay), useDailyGame
│  │  ├─ streak/               statisztika és streak
│  │  ├─ achievements/         definíciók + tiszta kiértékelő
│  │  ├─ progress/             ProgressProvider: játék vége → stats → achievementek → toast
│  │  └─ settings/             SettingsProvider, téma alkalmazása, useT
│  ├─ i18n/                    en.ts szótár, translate.ts, alphabet.ts
│  ├─ themes/                  fonts.css, tokens.css (light/dark/legacy), global.css
│  ├─ components/              Button, Icon, Modal, GuessRow, Keyboard, ErrorBoundary, toast/
│  ├─ screens/
│  │  ├─ Header.tsx
│  │  ├─ game/                 Game, SingleBoard, GridBoard, EndPanel
│  │  └─ modals/               Help, Stats, Achievements, Settings
│  ├─ test/setup.ts
│  ├─ App.tsx
│  └─ main.tsx
├─ netlify.toml
├─ index.html                  téma-inicializáló inline script (villanásmentes)
└─ package.json
```

A context-objektumok és hookok (`settingsContext.ts`, `progressContext.ts`, `toastContext.ts`) külön fájlban vannak a providerektől, hogy a Fast Refresh működjön.

## Rétegek és függőségi irány

```
screens / components  →  features  →  game, puzzles, storage, lib, i18n
```

- `game/`, `puzzles/`, `lib/` nem importál Reactot és nem érint `window`/`localStorage`-t.
- `storage/storage.ts` az egyetlen hely, ami a `localStorage`-et olvassa/írja. A kulcsok sémája (`StoreSpec`) a funkció mellett él (pl. `features/streak/stats.ts`).
- A játékállapotból **csak a tippek** tárolódnak, minden más (zárolt cellák, megoldott szavak, billentyűszínek) számolt érték.
- A komponensek nem számolnak játéklogikát, csak állapotot jelenítenek meg és akciót küldenek.

## Adatfolyam

1. Induláskor: `useCurrentDay()` (napkulcs + óra-védelem) → `puzzleForDay()` → `useDailyGame()` betölti az adott nap mentett játékát (ha nincs, új játék).
2. Tipp → `playReducer` (tiszta) → új állapot → mentés minden változás után (`saveGame`).
3. Játék vége → `recordGameEnd` → `recordGame` (stats, idempotens) → `evaluateAchievements` → mentés → toast.
4. Napváltás: 30 mp-enként és `visibilitychange`/`focus` eseményre újraellenőrzés. Új napnál a `Game` komponens új kulccsal újraindul.
5. Több lap: a `storage` esemény alapján a lap átveszi a másik lap haladóbb állapotát (`sync` akció), a statisztika és az achievementek újratöltődnek.

## Hibatűrés

- Ha a localStorage nem elérhető (privát mód, tiltva), az app memóriában működik, és egyszer jelzi, hogy az eredmények nem mentődnek.
- Sérült JSON/séma: az érintett kulcs (vagy rácsban az adott nap) alapértékre esik, a többi kulcs sértetlen marad.
- Hibás rejtvény futásidőben kimarad (a build-validátor ezt előre kiszűri).
- A teljes app `ErrorBoundary`-ben fut, érthető hibaüzenettel.

## Netlify

`netlify.toml`: build `yarn build`, publish `dist`, Node 22, SPA fallback (`/*` → `/index.html`, 200), hosszú cache a `/fonts/*` és `/assets/*` útvonalakra. A rejtvények a bundle része, nincs futásidejű API hívás.

## Nyelvi támogatás előkészítése

- Szótár: `src/i18n/en.ts` (`as const`), a kulcsok típusa `MessageKey`. A `hu.ts`-nek `Messages` típusúnak kell lennie, így hiányzó kulcs fordítási hiba.
- Rejtvények nyelvenként külön fájlban (`src/puzzles/<locale>.json`), a nyelv a beállításokban tárolódik.
- Ábécé és billentyűzetkiosztás nyelvenként (`src/i18n/alphabet.ts`).
- Az első kiadásban csak `en` aktív, de a `locale` végig át van vezetve.
