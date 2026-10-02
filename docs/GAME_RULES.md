# Játékszabályok

## Alapfogalmak

- **Rejtvény (puzzle):** egy napi feladvány: kategória + megoldás(ok).
- **Típus:** `single` (egy szó/kifejezés) vagy `grid` (keresztrejtvény-rács több szóval).
- **Tipp (guess):** egy teljes szó beküldése. Egy tipp = egy próbálkozás.
- **Előre megadott betű nincs.** A rács üresen indul. A játék során feltárt (zöld) betűk viszont megmaradnak.

## Betűk normalizálása

- Nagybetűs `A–Z` az első körben (angol). A magyar bővítésnél az ékezetes betűk (`Á É Í Ó Ö Ő Ú Ü Ű`) külön betűnek számítanak. A normalizálás nyelvenként konfigurálható (`src/i18n/alphabet`).
- Kifejezésnél (pl. `DAD BOD`) a szóköz **fix elválasztó**: nem tippelhető, nem számít bele a hosszba, a megjelenítésben rés.
- Kötőjel/írásjel a megoldásban nem engedett (lásd [PUZZLE_FORMAT.md](PUZZLE_FORMAT.md)).
- **Nincs szótár-ellenőrzés:** a megoldás lehet szójáték vagy kitalált kifejezés. A tipp csak akkor érvényes, ha a hossza és karakterei megfelelők. Érvénytelen tipp nem fogyaszt próbálkozást.

## Visszajelzés (Wordle-logika)

Minden tippelt betű három állapotú:

| Állapot | Jelentés |
|---|---|
| `correct` (zöld) | jó betű, jó helyen |
| `present` (sárga) | a betű szerepel a szóban, de máshol |
| `absent` (szürke) | nincs (több) ilyen betű a szóban |

Az ismétlődő betűk kezelése **kétmenetes**:

1. Első menet: minden pozíción, ahol a tipp és a megoldás egyezik → `correct`. A megoldás ezen betűi „elfogynak".
2. Második menet: a maradék tippbetűk balról jobbra: ha van még fel nem használt ilyen betű a megoldásban → `present` (és elhasználunk egyet), különben `absent`.

Példa: megoldás `APPLE`, tipp `PAPAL` → `P`(present) `A`(present) `P`(correct) `A`(absent) `L`(present). Ezt a példát unit tesztbe kell venni.

A virtuális billentyűzet billentyűi a legjobb ismert állapotot mutatják (`correct` > `present` > `absent`).

## Egyszavas mód (`single`)

- Egy megoldás, hossza 5–12 betű (szóközök nélkül).
- A játékos beírja a teljes szót, és beküldi. A jó helyen lévő betűk itt **nem** töltődnek elő (klasszikus Wordle).
- Győzelem: minden betű `correct`. Vereség: elfogy a tipp.

## Rácsos mód (`grid`)

- 3–5 szó, egy rácson (jellemzően 5×5 – 9×9), a szavak egymást metszik. A metszéspont betűje közös.
- A játékos **kijelöl egy szót** (szógombbal vagy cellára kattintva), beírja, és beküldi, mint az egyszavas módban. Egy kijelölt szó metszéspont-cellájára kattintva a kijelölés a keresztező szóra vált.
- A visszajelzés **szavanként** számolódik (a fenti algoritmus az adott szóra):
  - Egy cella, amely valamelyik tippben `correct` lett, **zárolt**: a rácsban zölden, betűvel látszik, a keresztező szóban is. Zárolt cella nem romlik vissza.
  - `present`/`absent` állapot csak a kijelölt szó tipptörténetében látszik (a rács alatt), a rácscellákban nem.
  - A billentyűzet színei rácsos módban **csak a kijelölt szó** tippjeiből számolódnak, mert egy betű az egyik szóban hiányozhat, a másikban nem.
- A kijelölt szó beviteli sorába a zárolt betűk **előre kitöltődnek**. A játékos csak a hiányzókat írja, de a beküldött tipp a teljes szó.
- Szó megoldása után a kijelölés automatikusan a következő megoldatlan szóra lép.
- Enter: rácscellán és a már kijelölt szó gombján is beküldés (nem a gomb újbóli megnyomása).
- Egy szó **megoldott**, ha minden cellája zárolt. A rács megoldott, ha minden szó az.
- Újra tippelhető egy már megoldott szó? Nem, a megoldott szó nem jelölhető ki.
- A tipp mindig fogyaszt, kivéve ha érvénytelen.

## Tippkorlát

A korlát a rejtvényből számolódik (`getMaxAttempts(puzzle)` a `src/game/attempts.ts`-ben), de a rejtvényfájl felülírhatja a `maxAttempts` mezővel.

| Típus | Képlet |
|---|---|
| `single` | hossz ≤ 6 → **6**, 7–9 → **7**, ≥ 10 → **8** |
| `grid` | `szavak száma + 3`, **+1** ha a leghosszabb szó ≥ 8 betű; minimum 6, maximum 10 |

Példák: 3 szavas rács → 6, 4 szavas → 7, 5 szavas hosszú szóval → 9.

A rácsos módban a korlát az egész rácsra közös. A képletet a játékpróbák alapján hangoljuk, a konstansok egy helyen (`src/game/config.ts`) vannak.

## Játékállapot

`in-progress` → `won` | `lost`. Beküldött tippek törlése nem lehetséges. Befejezett játékot a következő napig nem lehet újrakezdeni. A játék a nap váltásakor (helyi éjfél) tér át a következő rejtvényre, lásd [STORAGE_AND_TIME.md](STORAGE_AND_TIME.md).

## Vereség esetén

A megoldás(ok) felfedése, a streak megszakad, a megosztó kártya továbbra is elérhető (X/N jelöléssel).

## Megosztó kártya

Spoilermentes szöveg: cím, nap sorszáma, `eredmény/korlát`, `Clipboard API`-val másolható. A kártyában soha nincs betű.

- Egyszavas: tippenként egy sor 🟩🟨⬛ emojival.
- Rácsos (🧩 jelöléssel): a rács alakja, 🟩 = megfejtett cella, 🟥 = megfejtetlen cella (vereségnél), ⬛ = üres hely.
