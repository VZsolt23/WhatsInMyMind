# Kódolási konvenciók

## Általános

- Formátum: `.editorconfig` + Prettier (2 szóköz, LF, egyszeres idézőjel, pontosvessző, `printWidth: 100`). `yarn format` javít, `yarn format:check` ellenőriz. A rejtvény JSON-ok kimaradnak a Prettierből, hogy a szavak egy sorban olvashatók maradjanak.
- Csomagkezelő: **csak Yarn** (`yarn add`, `yarn add -D`). `package-lock.json` nem kerülhet a repóba.
- Lint: ESLint (`@typescript-eslint`, `react-hooks`, `jsx-a11y`). Figyelmeztetés sem maradhat commit előtt.
- TypeScript: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`. Nincs `any`, nincs `@ts-ignore` indoklás nélkül.
- Kommentek: csak a *miért*-et írd le, a *mit*-et a név mondja el. Ne kommentelj nyilvánvaló kódot.

## Elnevezés

| Mi | Stílus |
|---|---|
| Komponens fájl | `PascalCase.tsx` + `PascalCase.module.css` |
| Hook | `useCamelCase.ts` |
| Logikai modul | `camelCase.ts` |
| Típus/interface | `PascalCase`, nincs `I` előtag |
| Konstans | `UPPER_SNAKE_CASE` (csak valódi konstansra) |
| Teszt | `*.test.ts(x)` a tesztelt fájl mellett |
| localStorage kulcs | `wim:<név>` |

## Komponensek

- Függvénykomponens, tipizált props. Egy komponens egy fájl, egy felelősség.
- Üzleti logika nem kerül a komponensbe, `src/game/` vagy `src/features/` tiszta függvényei végzik.
- Nincs inline stílus, kivéve dinamikus CSS változó beállítás (pl. cellaméret).
- Elérhetőség: szemantikus elemek, `aria-label`, `aria-live` a visszajelzésre, kezelhető fókusz, modálban fókuszcsapda és `Esc` bezár.

## Tesztelés

- **Kötelező unit teszt:** `feedback`, `grid`, `attempts`, `reducer`, `dayKey`, `streak`, `achievements`, `storage` + migrációk, `daily`, `share`, validátor.
- **Komponens teszt:** a fő folyamatok (tipp beírása/beküldése, hibás tipp, győzelem, vereség, téma váltás, betöltés mentett állapotból).
- Idő: a logikai tesztekben mindig paraméterként átadott `now`, nincs globális `Date` mockolás. A teljes appot renderelő tesztek (`App.test.tsx`) `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime` párost használnak.
- A teszt a viselkedést vizsgálja, nem a megvalósítást. Hibajavításnál először a hibát reprodukáló teszt.
- Cél: a `src/game`, `src/features`, `src/storage`, `src/lib` mappákban ≥ 90% lefedettség.

## Git

- Branch: `master` stabil (a fő ág). Feladatok `feat/…`, `fix/…`, `docs/…`, `chore/…` ágon.
- Commit üzenet: [Conventional Commits](https://www.conventionalcommits.org/) – `feat(game): add two-pass feedback`, `fix(storage): handle corrupt JSON`, `docs: update rules`.
- Kis, önállóan zöld commitok. Egy commit = egy gondolat.
- Identitás a helyi repóban: `VZsolt23` / `v.zsolt2323@gmail.com`.
- Commit előtt: `yarn lint && yarn test && yarn build`.

## Függőségek

- Minimális. Új csomag előtt írd le az indokot (méret, karbantartottság).
- Verziók rögzítve a `yarn.lock`-ban. A frissítés külön commit.

## Teljesítmény és méret

- Cél: gyors betöltés (< 150 KB gzip JS), nincs CDN és nincs analitika. Betűtípus csak self-hosted: a JetBrains Mono három súlya (kb. 280 KB woff2 összesen, cache-elhető).
- A rejtvényfájl a bundle része, kicsi (< 50 KB).

## Biztonság és adatvédelem

- Nincs személyes adat, nincs süti, nincs hálózati hívás futásidőben.
- A localStorage tartalma nem megbízható: mindig validáld betöltéskor.
- `dangerouslySetInnerHTML` tilos.
