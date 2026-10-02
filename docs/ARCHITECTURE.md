# Architektúra

## Technológiai verem

| Réteg | Választás | Indok |
|---|---|---|
| Keretrendszer | React 18+ | kért |
| Build | Vite | kért |
| Nyelv | TypeScript (strict) | játéklogika biztonsága |
| Stílus | CSS Modules + CSS változók (design tokenek) | téma-váltás könyvtár nélkül |
| Állapot | `useReducer` + Context | kis app, nincs szükség külső könyvtárra |
| Teszt | Vitest + Testing Library | Vite-natív |
| Lint/formázás | ESLint + Prettier | konzisztencia |
| Hosting | Netlify (statikus) | kért |
| Tárolás | localStorage | ingyenes, szerver nélkül |

Nincs router: egyoldalas app, a statisztika/achievement/beállítások/súgó modálok vagy paneleket használnak.

## Mappaszerkezet

```
/
├─ docs/                    dokumentáció
├─ public/                  statikus fájlok (favicon, social image)
│  └─ fonts/                JetBrains Mono woff2 (Regular, Medium, Bold) + OFL.txt + AUTHORS.txt
├─ scripts/
│  └─ validate-puzzles.ts   rejtvény-validátor (build része)
├─ src/
│  ├─ game/                 TISZTA logika, UI nélkül, unit tesztelt
│  │  ├─ feedback.ts        betűkiértékelés (kétmenetes)
│  │  ├─ grid.ts            rácsmodell, cellák, zárolás, metszések
│  │  ├─ attempts.ts        getMaxAttempts
│  │  ├─ reducer.ts         játékállapot-gép
│  │  ├─ share.ts           megosztó kártya
│  │  └─ config.ts          konstansok
│  ├─ puzzles/
│  │  ├─ en.json            angol rejtvények (később hu.json)
│  │  ├─ schema.ts          típusok + futásidejű ellenőrzés
│  │  └─ daily.ts           napi rejtvény kiválasztása
│  ├─ storage/              localStorage réteg: verziózott, hibatűrő
│  │  ├─ storage.ts
│  │  ├─ migrations.ts
│  │  └─ schemas.ts
│  ├─ lib/
│  │  └─ dayKey.ts          az egyetlen időforrás
│  ├─ features/
│  │  ├─ streak/            streak és statisztika logika
│  │  └─ achievements/      definíciók + kiértékelő
│  ├─ i18n/                 szótárak (en, később hu), ábécé-konfig
│  ├─ themes/               tokens.css (light, dark, legacy), ThemeProvider
│  ├─ components/           megosztott UI (Button, Modal, Toast, Tile, Keyboard)
│  ├─ screens/              Game, SingleBoard, GridBoard, Stats, Achievements, Settings, Help
│  ├─ App.tsx
│  └─ main.tsx
├─ netlify.toml
├─ index.html
└─ package.json
```

## Rétegek és függőségi irány

```
screens/components  →  features  →  game, storage, puzzles, lib
```

- `game/`, `puzzles/`, `lib/` nem importál Reactot és nem érint `window`/`localStorage`-t.
- `storage/` az egyetlen hely, ami a `localStorage`-et olvassa/írja.
- A komponensek nem számolnak játéklogikát, csak állapotot jelenítenek meg és eseményt küldenek.

## Adatfolyam

1. Induláskor: `dayKey.today()` → `daily.getPuzzle(dayKey)` → mentett állapot betöltése a nap kulcsával (ha nincs, új játék).
2. Tipp beküldése → `reducer` (tiszta) → új állapot → mentés (`storage`) → UI.
3. Játék vége → `streak` frissítés → `achievements` kiértékelés → mentés → értesítés.

## Hibatűrés

- Ha a localStorage nem elérhető (privát mód, tiltva), az app memóriában működik és egyszer jelzi, hogy az eredmények nem mentődnek.
- Sérült JSON/séma: az érintett kulcsot eldobjuk, alapértékkel indulunk, a többi kulcs sértetlen marad.
- A teljes app `ErrorBoundary`-ben fut, érthető hibaüzenettel.

## Netlify

`netlify.toml`: build `npm run build`, publish `dist`, SPA fallback (`/*` → `/index.html`, 200). A rejtvények a bundle része, nincs futásidejű API hívás.

## Nyelvi támogatás előkészítése

- Szótár: `src/i18n/en.ts` típusos objektum; a `hu.ts` ugyanazt a típust valósítja meg.
- Rejtvények nyelvenként külön fájlban, a nyelv a beállításokban tárolódik.
- Ábécé és billentyűzetkiosztás nyelvenként (`src/i18n/alphabet.ts`).
- Az első kiadásban csak `en` aktív, de a `locale` paraméter végig át van vezetve.
