# Rejtvény formátum és készítés

A rejtvények kézzel szerkesztett JSON fájlban élnek: `src/puzzles/<locale>.json` (első kör: `en.json`). A fájl a puzzle objektumok tömbje, a sorrend adja a napi sorrendet.

## Napi kiválasztás

```
dayNumber = napok száma LAUNCH_DATE óta (naptári napokban, lásd STORAGE_AND_TIME.md)
puzzle    = puzzles[dayNumber mod puzzles.length]
```

A `LAUNCH_DATE` a `src/game/config.ts`-ben van. Induláskor **legalább 30** rejtvény kell. A lista bővítése új elemek hozzáfűzésével történik, meglévő elem sorrendjét kiadás után nem változtatjuk.

## Egyszavas (`single`)

```json
{
  "id": "en-001",
  "type": "single",
  "category": "A bit out of shape these days",
  "answer": "DAD BOD"
}
```

## Rácsos (`grid`)

```json
{
  "id": "en-004",
  "type": "grid",
  "category": "Things in a toolbox",
  "rows": 5,
  "cols": 5,
  "words": [
    { "id": "w1", "answer": "HAMMER", "row": 0, "col": 0, "dir": "across" },
    { "id": "w2", "answer": "SAW",    "row": 0, "col": 3, "dir": "down" },
    { "id": "w3", "answer": "DRILL",  "row": 2, "col": 0, "dir": "across", "clue": "Makes holes" }
  ],
  "maxAttempts": 8
}
```

Mezők:

| Mező | Kötelező | Leírás |
|---|---|---|
| `id` | igen | egyedi, stabil azonosító (`<locale>-<sorszám>`) |
| `type` | igen | `single` vagy `grid` |
| `category` | igen | a téma/utalás, ezt látja a játékos |
| `answer` | single | nagybetűs megoldás, szóközt tartalmazhat |
| `rows`, `cols` | grid | a rács mérete |
| `words[]` | grid | 3–5 szó |
| `words[].answer` | igen | nagybetűs, szóköz nélkül |
| `words[].row/col` | igen | kezdőcella (0-tól) |
| `words[].dir` | igen | `across` vagy `down` |
| `words[].clue` | nem | rövid, külön tipp az adott szóhoz |
| `maxAttempts` | nem | felülírja a képletet |
| `note` | nem | szerkesztői megjegyzés, a játékban nem jelenik meg |

## Szerkesztési szabályok

- Nincs előre megadott betű, nincs „jelölt" kezdőbetű.
- A kategória legyen szójáték, körülírás vagy téma. A megoldás a kategóriából következzen („ahá"-élmény).
- Egyszavas megoldás 5–12 betű (szóköz nélkül), rács szavai 3–8 betű.
- Rácsban **minden szó** illeszkedjen a kategóriához, és legalább egy metszése legyen (az egész rács összefüggő).
- Metszésnél a két szó betűje azonos legyen.
- Két szó ne érjen össze oldalról úgy, hogy nem szándékolt új szót alkot (szomszédos párhuzamos szavak tiltva).
- Ne legyen mindenhol a legnehezebb, a 30 napban kb. 20 egyszavas / 10 rácsos, nehézségben vegyesen (kb. 40% könnyű, 40% közepes, 20% nehéz).
- Kerüljük a kényes, sértő vagy napi aktualitáshoz kötött témákat. Angol rejtvénynél a magyar szójátékokat nem fordítjuk szó szerint.

## Validátor (`yarn validate`, a build része)

Hibát jelez (nem nulla kilépési kód), ha:

1. az `id` duplikált vagy a séma sérül (hiányzó mező, rossz típus);
2. a `answer` nem csak `A–Z` (+ szóköz single esetén);
3. egy szó kilóg a rácsból;
4. metszéspontban a betűk nem egyeznek;
5. két szó átfed ugyanabban az irányban vagy nem szándékolt szomszédságot hoz létre;
6. a rács nem összefüggő;
7. a szavak/hosszak kívül esnek a megengedett tartományon;
8. kevesebb mint `MIN_PUZZLES` (30) rejtvény van.

A szabályok a `src/puzzles/validate.ts`-ben vannak, ezt használja a build-szkript és a futásidejű betöltés is. A 3–5. pont egyetlen szabályból következik: a rácsban minden legalább 2 hosszú, egybefüggő betűsor (soronként és oszloponként) pontosan egy szó kell legyen.

`yarn validate --min=N` felülírja a minimumot (pl. új nyelv fejlesztése közben).

## Tartalomkészítési folyamat

1. Téma és megoldás kitalálása → 2. rácsnál elhelyezés → 3. `yarn validate` → 4. játékpróba (kézzel), nehézség besorolása a `note`-ban → 5. commit.
A rejtvényeket csoportosan (5–10 egyszerre) készítjük, és mindegyiket egy második kör után véglegesítjük.
