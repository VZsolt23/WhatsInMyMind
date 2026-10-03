# Tárolás és idő

## Alapelv

Minden adat a böngésző localStorage-ében van. A kulcsok előtagja `wim:`, minden érték verziózott JSON. A localStorage olvasása/írása kizárólag a `src/storage/` rétegben történik, minden hívás `try/catch`-ben.

## Kulcsok és séma (v1)

| Kulcs | Tartalom |
|---|---|
| `wim:settings` | `{ v, theme: "light"\|"dark"\|"legacy"\|"system", locale: "en", reducedMotion: boolean, seenHelp: boolean }` |
| `wim:games` | `{ v, byDay: { "2026-10-03": GameState, ... } }` |
| `wim:stats` | `{ v, played, won, lost, currentStreak, bestStreak, lastBrokenStreak, lastCompletedDay, lastRecordedDay, guessDistribution: number[], gridPlayed, gridWon }` |
| `wim:meta` | `{ v, lastSeenDay }` (óra-manipuláció elleni védelem) |
| `wim:achievements` | `{ v, unlocked: { [id]: { day, at } }, counters: {...} }` |

`GameState`:

```ts
{
  puzzleId: string;
  day: string;                    // dayKey
  status: "in-progress" | "won" | "lost";
  guesses: { slotId: string; letters: string; states: LetterState[] }[]; // single: slotId "main"
  completedAt?: string;           // ISO időbélyeg
  completedHour?: number;         // helyi óra 0–23 (Night Owl / Early Bird)
}
```

Szabályok:

- A `v` (sémaverzió) minden kulcsban kötelező. Minden kulcsnak saját `StoreSpec`-je van (`key`, `version`, `defaults`, `parse`, `migrations`). Betöltéskor a `migrations[n]` lépésenként emeli a dokumentumot a jelenlegi verzióra. Ismeretlen (jövőbeli) verzió → alapérték.
- Betöltés után **validáció** (`parse`). Hiányzó/sérült érték → alapérték. A többi kulcsot ez nem érinti. A `wim:games`-ben egy sérült nap kiesik, a többi megmarad.
- Séma módosítása: `version` emelése + migráció + teszt.
- `wim:games`: 60 napnál régebbi napok törlődnek.
- A mentés minden játékállapot-változás után azonnal megtörténik (nem csak játék végén), így frissítés nem veszít tippet.
- Ha a localStorage nem elérhető → memória-tartalék, egyszeri figyelmeztetés.
- Több lapon megnyitott app: `storage` esemény figyelése, a lap újratölti a kulcsot. A játékállapotot csak akkor veszi át, ha a másik lapé haladóbb (több tipp), így nem írja felül vakon.

## A „nap" fogalma

- A nap a játékos **helyi naptári napja**, `YYYY-MM-DD` formátumú `dayKey`.
- Csak az `src/lib/dayKey.ts` kérdezi le az időt. Függvények:
  - `todayKey(now = new Date()): string`
  - `daysBetween(a: string, b: string): number` (a `Date.UTC(y, m-1, d)` alapján, így DST-biztos)
  - `addDays(key, n): string`
  - `msUntilNextDay(now)`: a visszaszámlálóhoz
- Tesztben a `now` paraméterrel az idő befagyasztható, `Date` mockolása nélkül. Kivétel: a teljes appot renderelő komponens-tesztek `vi.setSystemTime`-ot használnak.
- A rejtvény sorszáma (1-től): `daysBetween(LAUNCH_DATE, today) + 1`, az indulás előtti napokon 1.
- A `LAUNCH_DATE` (2026-10-03) kiadás után nem változhat: eltolná a sorszámokat, és a mentett játékok `puzzleId`-je nem egyezne a napi rejtvénnyel.

## Mi történik éjfélkor?

Az app nyitva tartva is észreveszi a napváltást: 30 másodpercenként, valamint `visibilitychange`/`focus` eseményre újraellenőrzi a `dayKey`-t. Napváltáskor az új napi játékra vált, a régi állapot a `byDay`-ben marad.

## Streak szabályok

A rögzítés (`recordGame`) **idempotens**: ha a nap már rögzítve van (`lastRecordedDay` ≥ a játék napja), semmi nem változik. Így újratöltés, StrictMode vagy másik lap nem számol duplán.

Győzelemnél a `lastCompletedDay` alapján:

| Helyzet | Eredmény |
|---|---|
| `lastCompletedDay` == tegnap | `currentStreak += 1` |
| régebbi vagy nincs | `currentStreak = 1` (a korábbi, nem nulla streak a `lastBrokenStreak`-be kerül) |

Mindig: `bestStreak = max(bestStreak, currentStreak)`.

- Csak győzelem számít megoldásnak. **Vereségnél** a streak azonnal nullázódik (hossza a `lastBrokenStreak`-be kerül), a `lastCompletedDay` nem frissül.
- A `lastBrokenStreak`-et a Comeback Kid achievement használja.
- Megjelenítéskor: ha `lastCompletedDay` régebbi mint tegnap, a mutatott streak **0** (a tárolt érték csak a következő győzelemnél íródik át).
- Megoldás nélkül kihagyott nap = streak törés (nincs „fagyasztás" az első kiadásban).

## Óra-manipuláció elleni védelem

Elmentjük a `wim:meta.lastSeenDay`-t (legnagyobb eddig látott `dayKey`).

- Ha a mai `dayKey` kisebb, mint a `lastSeenDay`: a „mai nap" a `lastSeenDay`, ami a mentett játékot mutatja, új játékot nem enged. Egy rövid üzenet jelzi, hogy az eszköz órája eltér.
- Előre állított óra: a rejtvény a jövő napjára vált, de a streaket ez nem védi meg a visszaélésektől, mert nincs szerver. Ez tudatos kompromisszum (nincs backend, a játék nem versengő).

## Dátumok a tesztekben

Kötelező tesztesetek: hónap-/évhatár, szökőév (2028-02-29), DST-átállás napja, utolsó megoldás tegnap/ma/két napja, óra visszaállítása, megszakadt streak utáni újraindulás.
