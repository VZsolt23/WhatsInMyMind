# WhatsInMyMind

Napi szókitalálós játék a Szerencsekerék kategória-témáiból és a Wordle visszajelzési logikájából építkezve. Minden napra egy rejtvény jut, egy kategória (téma) alapján kell kitalálni a rejtett szót vagy szavakat.

> Az app neve nem kötődik egyetlen játékmódhoz: később más játékok is kerülhetnek bele ugyanazon a néven belül.

## Röviden a játékról

- **Napi rejtvény:** mindenkinek ugyanaz a rejtvény egy adott napon, naponta egy játék.
- **Kategória/téma:** a játékos egy utalást kap, mint a Szerencsekerékben. Példa: *„Kicsit már puhány"* → válasz: *Aputest*. Az utalás lehet szójáték, körülírás vagy tágabb téma.
- **Nincs előre megadott betű:** a rács üresen indul, csak a kategória segít.
- **Wordle-logika:** tippelés után betűnkénti visszajelzés (zöld: jó helyen, sárga: benne van, de máshol, szürke: nincs benne).
- **Korlátozott próbálkozás:** véges számú tipp naponta, a rejtvény méretétől függően.

## Játékmódok

1. **Egy szavas:** egy kategória, egy szó vagy kifejezés, Wordle-szerű tippelés.
2. **Többszavas (keresztrejtvény-stílus):** egy témakörhöz több szó tartozik, egy rácsban elhelyezve. A szavak metszik egymást, a metszéspontban lévő betű mindkét szóhoz tartozik. Ha az egyik szóban feltárul egy betű, a kereszteződő szóban is megjelenik.

## Funkciók

- **Napi streak:** egymást követő napokon megoldott rejtvények számlálója, plusz a legjobb streak.
- **Achievementek:** pl. első megoldás, 3/7/30 napos streak, megoldás első tippre, megoldás az utolsó tippből, a többszavas mód teljesítése.
- **Statisztikák:** játszott/megnyert játékok, tippeloszlás.
- **Megosztás:** spoilermentes eredmény-kártya (emoji-rács), Discordba/chatbe másolható.
- **Egy játék naponta:** a mai állapot (folyamatban/kész) megmarad újratöltés után is.

## Témák (dizájn)

| Téma | Leírás |
|---|---|
| **Világos** | Egyszerű, modern, frappáns |
| **Sötét** | Ugyanaz a dizájnnyelv sötét palettával |
| **Legacy** | 2000-es évek eleji stílus: lekerekítetlen gombok, 3D-s szegélyek, gradiens fejlécek, Tahoma/Verdana jellegű betűk |

A kiválasztott téma localStorage-ben tárolódik. Első indításkor a rendszer beállítását (`prefers-color-scheme`) követi.

## Technológia

- **React + Vite** (JavaScript vagy TypeScript)
- **Hosting:** Netlify (statikus build, `npm run build` → `dist`)
- **Adattárolás:** csak a böngészőben (localStorage), nincs backend, nincs költség
  - téma, streak, achievementek, statisztikák, a mai játék állapota
- **Napi rejtvény kiválasztása:** statikus rejtvényfájl (JSON), a dátum alapján determinisztikusan választva. Szerver nélkül is mindenkinek ugyanaz a mai feladvány.

## Nyelvek

1. **Első kör: angol.** Az angol rejtvények saját kategóriákkal és szójátékokkal készülnek (a magyar példa nem fordítható szó szerint, pl. *Dad bod*).
2. **Második kör: magyar.** Külön magyar rejtvénykészlet és magyar billentyűzet (ékezetes betűk kezelése). A felület szövegei i18n-alapon készülnek, hogy a nyelv később váltható legyen.

## Többszavas tippelés

A játékos kijelöl egy sort vagy oszlopot (egy szót a rácsban), beírja a teljes szót, és tippel, pont mint az egy szavas módban. A visszajelzés (zöld/sárga/szürke) a szó celláiba kerül. A metszéspontokban a betű a keresztező szóban is megjelenik, a zöld cella ott is zöld marad. A tippkorlát a teljes rácsra közös.

## Rejtvények előállítása

A rejtvények **kézzel szerkesztett adatfájlban** (JSON) vannak: minden napnak saját kategóriája, szavai, és a rács elhelyezése (melyik szó hol kezdődik, melyik irányba). Generátor nincs, így a kategória-utalások és a keresztezések minőségét mi szabályozzuk.

Egy ellenőrző szkript (validátor) buildkor lefut, és hibát jelez, ha egy metszéspontban nem egyezik a betű, a szavak kilógnak a rácsból vagy összeérnek.

**Indulási tartalom: 30 napnyi rejtvény** (angolul), vegyesen egy szavas és többszavas napokkal.

## Achievementek

| Név | Feltétel |
|---|---|
| **First Thoughts** | Az első megoldott rejtvény |
| **Mind Reader** | Megoldás az első tippre |
| **Clutch** | Megoldás az utolsó tippből |
| **Warming Up** | 3 napos streak |
| **On a Roll** | 7 napos streak |
| **Mastermind** | 30 napos streak |
| **Crossed Wires** | Első megoldott többszavas rács |
| **Grid Lock** | 5 megoldott többszavas rács |
| **Night Owl** | Megoldás éjfél és hajnali 4 között |
| **Early Bird** | Megoldás reggel 6 előtt |
| **Comeback Kid** | Új streak indítása elvesztett streak után |
| **Retro Soul** | A legacy téma kipróbálása |
| **Flawless** | 5 megoldás egymás után legfeljebb 3 tippből |

Az achievementek a megszerzés dátumával együtt tárolódnak, és az eredmények között látszanak (megszerzéskor értesítéssel).

## Idő- és streak-kezelés

- A „nap" a játékos **helyi naptári napja** (`YYYY-MM-DD` szöveg), nem időbélyeg. A számolás dátumokkal történik, így nyári/téli időszámítás nem okoz csúszást.
- A mai rejtvény = a dátum és a startdátum különbsége napokban (naptári napszámmal), a rejtvénylista hosszával körbeforgatva.
- Streak: ha az utolsó megoldás napja = tegnap, a streak nő. Ha ma már megoldott, nem változik. Ha ennél régebbi, a streak 1-ről újraindul (a legjobb streak megmarad).
- Védelem az óra átállítása ellen: ha az eszköz dátuma korábbi az utoljára mentett napnál, a mentett napot tekintjük érvényesnek, és nem engedünk új játékot újabb dátum nélkül.
- Egy nap, egy játék: a mai állapot (tippek, kész/folyamatban) a nap kulcsával mentődik, és a következő napon automatikusan lecserélődik.
- A localStorage adatok verziószámmal vannak ellátva, hogy később biztonságosan migrálhatók legyenek. Sérült vagy hiányzó adatnál az app üres állapottal indul, nem omlik össze.

## Döntések

- **Rács:** 3–5 szó, 5×5 – 9×9 méretű; szavak 3–8 betűsek.
- **Tippkorlát:** a rejtvény szavainak számától és hosszától függ (egyszavasnál 6–8, rácsnál 6–10). A képlet a [docs/GAME_RULES.md](docs/GAME_RULES.md)-ben van.
- **Legacy téma:** Windows 98 / XP hangulat (bevel keretek, kék címsor, Tahoma). Eredeti MS-eszközöket nem használunk.
- **Repó:** helyi git, `VZsolt23` / `v.zsolt2323@gmail.com`.

## Fejlesztői dokumentáció

Szabályok és feladatok: [CLAUDE.md](CLAUDE.md). Részletek a [docs/](docs/) mappában:

- [GAME_RULES.md](docs/GAME_RULES.md): játékszabályok, visszajelzés, tippkorlát
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): technológia, mappaszerkezet, rétegek
- [PUZZLE_FORMAT.md](docs/PUZZLE_FORMAT.md): rejtvény JSON, szerkesztési szabályok, validátor
- [STORAGE_AND_TIME.md](docs/STORAGE_AND_TIME.md): localStorage séma, napkezelés, streak
- [ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md): achievement-lista és szabályok
- [THEMES.md](docs/THEMES.md): témák, design tokenek, legacy dizájn
- [CODING_STANDARDS.md](docs/CODING_STANDARDS.md): konvenciók, tesztelés, git
- [TASKS.md](docs/TASKS.md): feladatbontás mérföldkövekre (M0–M11)
