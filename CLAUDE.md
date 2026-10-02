# WhatsInMyMind – fejlesztési szabályok

Napi szókitalálós játék (Wordle-logika + Szerencsekerék-kategóriák, egyszavas és keresztrejtvény-rácsos mód). Áttekintés: [README.md](README.md). Részletek: [docs/](docs/).

## Dokumentumok (olvasd el a releváns részt, mielőtt kódolsz)

| Téma | Fájl |
|---|---|
| Játékszabályok, tippkorlát, visszajelzési algoritmus | [docs/GAME_RULES.md](docs/GAME_RULES.md) |
| Architektúra, mappaszerkezet, technológia | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Rejtvény JSON formátum, készítési szabályok | [docs/PUZZLE_FORMAT.md](docs/PUZZLE_FORMAT.md) |
| localStorage séma, idő- és streak-kezelés | [docs/STORAGE_AND_TIME.md](docs/STORAGE_AND_TIME.md) |
| Achievementek | [docs/ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md) |
| Témák, design tokenek, legacy téma | [docs/THEMES.md](docs/THEMES.md) |
| Kódolási konvenciók, tesztelés, git | [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) |
| Feladatbontás, mérföldkövek | [docs/TASKS.md](docs/TASKS.md) |

## Parancsok

```bash
yarn dev            # fejlesztői szerver
yarn build          # puzzle-validáció + tsc + vite build
yarn test           # vitest (egyszer)
yarn test:watch     # vitest figyelő módban
yarn coverage       # lefedettségi riport
yarn lint           # eslint
yarn format         # prettier --write
yarn validate       # rejtvényfájlok ellenőrzése (alapból min. 30 rejtvény; --min=N felülírja)
```

Csomagkezelő: **Yarn 1**. npm-et ne használj (nincs `package-lock.json`).

## Alapszabályok

1. **TypeScript strict**, `any` tilos. Új logika tiszta függvényekben él a `src/game/` alatt, UI nélkül, és tesztelt.
2. **Nincs backend, nincs külső szolgáltatás.** Minden állapot localStorage-ben, verziózott sémával.
3. **Egyetlen forrás az időre:** a „mai nap" kizárólag `src/lib/dayKey.ts`-en keresztül kérhető le. Komponensben tilos közvetlenül `new Date()` / `Date.now()` használata játéklogikához.
4. **Minden felhasználói szöveg a i18n szótárból** jön (`src/i18n/`). Nincs beégetett string a komponensekben, így a magyar nyelv utólag hozzáadható.
5. **Színek csak CSS változókon (design tokeneken) keresztül.** Komponensben nincs hexa kód, mert a három téma (light/dark/legacy) ugyanazokat a komponenseket használja.
6. **Nincs UI-könyvtár, nincs állapotkezelő könyvtár** (useReducer + Context elég). Új függőség előtt indokold meg.
7. **Elérhetőség:** billentyűzettel teljesen játszható, a visszajelzés nem csak színnel jelenik meg (ikon/minta/aria-label), `prefers-reduced-motion` tiszteletben tartva.
8. **Spoilertilalom:** a megoldás nem kerülhet DOM-attribútumba/aria-labelbe a játék vége előtt, és a megosztó kártyában nincs betű.

## Munkafolyamat

- Egy feladat = egy kis, önállóan zöld lépés. A [docs/TASKS.md](docs/TASKS.md) mérföldköveit sorrendben haladd.
- Mielőtt kész jelölsz egy feladatot: `yarn lint && yarn test && yarn build` hibamentes.
- Játéklogikai változásnál először a teszt, aztán a kód.
- Szabálymódosításnál frissítsd a megfelelő `docs/` fájlt is, a dokumentáció és a kód nem térhet el.
- Commit: csak kérésre. Üzenetstílus: [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).
- Git identitás (helyi repo): `VZsolt23` / `v.zsolt2323@gmail.com`. Ne írd át globálisan.

## Amit ne csinálj

- Ne generálj rejtvényt futásidőben, a rejtvények kézzel írt adatfájlban vannak.
- Ne tárolj személyes adatot, ne használj analitikát/sütit.
- Ne módosítsd a mentett séma mezőit migráció nélkül.
