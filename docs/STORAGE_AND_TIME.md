# Tárolás és idő

## Alapelv

Minden adat a böngésző localStorage-ében van. A kulcsok előtagja `wim:`, minden érték verziózott JSON. A localStorage olvasása/írása kizárólag a `src/storage/` rétegben történik, minden hívás `try/catch`-ben.

## Kulcsok és séma (v1)

| Kulcs | Tartalom |
|---|---|
| `wim:settings` | `{ v, theme: "light"\|"dark"\|"legacy"\|"system", locale: "en", reducedMotion?: boolean }` |
| `wim:games` | `{ v, byDay: { "2026-10-03": GameState, ... } }` |
| `wim:stats` | `{ v, played, won, lost, currentStreak, bestStreak, lastBrokenStreak, lastCompletedDay, guessDistribution: number[], gridPlayed, gridWon }` |
| `wim:meta` | `{ v, lastSeenDay }` (óra-manipuláció elleni védelem) |
| `wim:achievements` | `{ v, unlocked: { [id]: { day, at } }, counters: {...} }` |

`GameState`:

```ts
{
  puzzleId: string;
  day: string;                    // dayKey
  status: "in-progress" | "won" | "lost";
  guesses: Guess[];               // beküldött tippek (grid esetén wordId-vel)
  completedAt?: string;           // ISO időbélyeg
  completedHour?: number;         // helyi óra 0–23 (Night Owl / Early Bird)
}
```

Szabályok:

- A `v` (sémaverzió) minden kulcsban kötelező. Betöltéskor a `migrations.ts` lépésenként emeli a jelenlegi verzióra.
- Betöltés után **validáció** (futásidejű séma). Hiányzó/sérült érték → alapérték. A többi kulcsot ez nem érinti.
- `wim:games`: 60 napnál régebbi napok törlődnek.
- A mentés minden játékállapot-változás után azonnal megtörténik (nem csak játék végén), így frissítés nem veszít tippet.
- Ha a localStorage nem elérhető → memória-tartalék, egyszeri figyelmeztetés.
- Több lapon megnyitott app: `storage` esemény figyelése, a lap újratölti a kulcsot (nem írja felül vakon).

## A „nap" fogalma

- A nap a játékos **helyi naptári napja**, `YYYY-MM-DD` formátumú `dayKey`.
- Csak az `src/lib/dayKey.ts` kérdezi le az időt. Függvények:
  - `todayKey(now = new Date()): string`
  - `daysBetween(a: string, b: string): number` (a `Date.UTC(y, m-1, d)` alapján, így DST-biztos)
  - `addDays(key, n): string`
- Tesztben a `now` paraméterrel az idő befagyasztható, `Date` mockolása nélkül.
- A mai rejtvény sorszáma: `daysBetween(LAUNCH_DATE, today)`, negatív érték (óra előtte) esetén 0.

## Mi történik éjfélkor?

Az app nyitva tartva is észreveszi a napváltást: percenként (és `visibilitychange`-re) újraellenőrzi a `dayKey`-t. Napváltáskor az új napi játékra vált, a régi állapot a `byDay`-ben marad.

## Streak szabályok

Frissítés a játék végén (győzelem) a `lastCompletedDay` alapján:

| Helyzet | Eredmény |
|---|---|
| `lastCompletedDay` == ma | nincs változás (már számolt) |
| `lastCompletedDay` == tegnap | `currentStreak += 1` |
| régebbi vagy nincs | `currentStreak = 1` |

Mindig: `bestStreak = max(bestStreak, currentStreak)`.

- Csak győzelem számít megoldásnak. Vereségnél a `lastCompletedDay` nem frissül, így a veszteség napja kihagyott napnak számít, és a streak a következő győzelemnél újraindul 1-ről.
- Újraindításkor a megszakadt streak hossza a `lastBrokenStreak`-be kerül (a Comeback Kid achievement használja).
- Megjelenítéskor: ha `lastCompletedDay` régebbi mint tegnap, a mutatott streak **0** (a tárolt érték csak a következő győzelemnél íródik át).
- Megoldás nélkül kihagyott nap = streak törés (nincs „fagyasztás" az első kiadásban).

## Óra-manipuláció elleni védelem

Elmentjük a `wim:meta.lastSeenDay`-t (legnagyobb eddig látott `dayKey`).

- Ha a mai `dayKey` kisebb, mint a `lastSeenDay`: a „mai nap" a `lastSeenDay`, ami a mentett játékot mutatja, új játékot nem enged. Egy rövid üzenet jelzi, hogy az eszköz órája eltér.
- Előre állított óra: a rejtvény a jövő napjára vált, de a streaket ez nem védi meg a visszaélésektől, mert nincs szerver. Ez tudatos kompromisszum (nincs backend, a játék nem versengő).

## Dátumok a tesztekben

Kötelező tesztesetek: hónap-/évhatár, szökőév (2028-02-29), DST-átállás napja, utolsó megoldás tegnap/ma/két napja, óra visszaállítása, megszakadt streak utáni újraindulás.
