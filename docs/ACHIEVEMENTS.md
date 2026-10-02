# Achievementek

Az achievementek definíciója és kiértékelése a `src/features/achievements/achievements.ts`-ben él. A kiértékelés tiszta függvény: `evaluateAchievements(state, event, day, at) => { state, newlyUnlocked }`. A nevek és leírások az i18n szótárban vannak (`achievement.<id>.name/desc`). Az egyszer megszerzett achievement soha nem vész el. Mentés: `wim:achievements` ([STORAGE_AND_TIME.md](STORAGE_AND_TIME.md)).

| ID | Név | Feltétel | Ikon (javaslat) |
|---|---|---|---|
| `first-thoughts` | First Thoughts | az első megnyert játék | 💭 |
| `mind-reader` | Mind Reader | megoldás az **első** tippre | 🔮 |
| `clutch` | Clutch | megoldás az **utolsó** lehetséges tippből | 😮‍💨 |
| `warming-up` | Warming Up | 3 napos streak | 🔥 |
| `on-a-roll` | On a Roll | 7 napos streak | 🎯 |
| `mastermind` | Mastermind | 30 napos streak | 🧠 |
| `crossed-wires` | Crossed Wires | első megoldott rácsos rejtvény | ✖️ |
| `grid-lock` | Grid Lock | 5 megoldott rácsos rejtvény | 🧩 |
| `night-owl` | Night Owl | megoldás helyi idő szerint 00:00–03:59 között | 🦉 |
| `early-bird` | Early Bird | megoldás helyi idő szerint 04:00–05:59 között | 🐦 |
| `comeback-kid` | Comeback Kid | új streak indítása elvesztett (≥ 3 napos) streak után | 🔄 |
| `retro-soul` | Retro Soul | a legacy téma kiválasztása | 💾 |
| `flawless` | Flawless | 5 egymás utáni megoldás (nem feltétlen egymást követő napokon), mindegyik ≤ 3 tippből | ✨ |

## Szabályok

- Kiértékelési események: `gameEnded` (győzelem és vereség, a frissített statisztikával) és `themeChanged`. A `gameEnded` naponta egyszer fut, mert a statisztika rögzítése idempotens.
- `Night Owl` / `Early Bird`: a `completedHour` (helyi óra) alapján, nem UTC.
- `Comeback Kid`: a `stats` előző `bestStreak`/megszakadt streak adataiból kiszámolható (a megszakadt streak hosszát a `stats.lastBrokenStreak` tárolja).
- `Flawless`: számláló a `counters.flawlessRun`-ban, a nem teljesítő játék (vereség vagy > 3 tipp) nullázza.
- Megszerzéskor toast értesítés jelenik meg, az Achievements panelen a megszerzés dátuma látszik. A még nem megszerzettek halványan, a feltétellel együtt láthatók (kivéve rejtetteknek jelölt, ha később bevezetünk).
- Új achievement hozzáadása = definíció + teszt + sor ebben a táblázatban.

## Tesztek

Minden achievementre legalább egy pozitív és egy negatív teszt, plusz: egyszer megszerzett nem szerezhető újra, a streak-alapúak nap-határon és kihagyott napon.
