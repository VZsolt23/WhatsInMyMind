# Témák és dizájn

## Témák

| Azonosító | Leírás |
|---|---|
| `light` | modern, letisztult, világos |
| `dark` | ugyanaz a nyelv sötét palettával |
| `legacy` | retró, Windows 98 / XP hangulat |
| `system` | beállítás (nem téma): `light`/`dark` követi az OS-t (`prefers-color-scheme`) |

Alapérték első indításkor: `system`. A választás a `wim:settings.theme`-ben tárolódik. A téma a `<html data-theme="...">` attribútumon keresztül váltódik, és az első festés előtt beállítódik (inline script az `index.html`-ben), hogy ne villanjon rossz téma.

## Design tokenek

Minden szín, térköz, sugár, árnyék, betűtípus CSS változó a `src/themes/tokens.css`-ben, témánként felülírva. A komponensek **csak** tokent használnak.

Kötelező tokencsoportok:

- `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`
- játékállapotok: `--color-correct`, `--color-present`, `--color-absent` (+ `-text` párjuk)
- `--radius-*`, `--space-*`, `--shadow-*`, `--font-body`, `--font-display`, `--font-mono`
- `--border-style` (modern: vékony vonal, legacy: bevel/inset, lásd lent)
- `--motion-*` (átmeneti idők; `prefers-reduced-motion` esetén 0)

Kontraszt: szöveg legalább WCAG AA (4.5:1), a nagy félkövér csempe- és billentyűbetűk legalább 3:1 mindhárom témában. Ezt a `src/themes/contrast.test.ts` a `tokens.css`-ből automatikusan ellenőrzi; új színpár vagy téma esetén bővítsd. A retró témában a türkiz asztalon nincs szöveg, ezért ez a pár kivétel. A zöld/sárga/szürke állapotot **másodlagos jelzés** is kíséri (pl. ikon vagy mintázat a csempén, magas kontrasztú mód lehetősége).

## Modern témák (light/dark)

- Egyszerű, sok levegő, lekerekített csempék, finom animációk (csempe-fordulás, rázkódás hibás tippnél).
- Betűtípus: **JetBrains Mono** (self-hosted) a teljes felületen, a csempéken és a címeken is. Fallback: `ui-monospace, "Cascadia Mono", Consolas, monospace`.
  - Fájlok: `public/fonts/JetBrainsMono-{Regular,Medium,Bold}.woff2` (400/500/700), `font-display: swap`, az `index.html`-ben a Regular és Bold `preload`.
  - `@font-face` a `src/themes/fonts.css`-ben, `--font-body`, `--font-display` és `--font-mono` mind erre mutat a modern témákban.
  - Más betűtípus vagy dőlt változat nem kell. Új súly felvétele előtt indokold meg (méret).
  - A licenc (SIL OFL 1.1) a `public/fonts/OFL.txt`, a szerzők listája a `public/fonts/AUTHORS.txt` fájlban van. Mindkettőt a betűtípus mellett kell tartani, nem törölhetők.
  - A betűtípus fix szélessége miatt a csempék és a beviteli sorok egyenletesek, a szélességet `ch` egységgel is lehet méretezni.
- Frappáns, de visszafogott: egy akcentszín, a visszajelzés-színek hangsúlyosak.

## Legacy téma (Windows 98 / XP)

Első kiadásban **Windows 98** stílus, XP-s elemekkel megfejelve (a téma szerkezete lehetővé teszi, hogy később külön `legacy-xp` téma is legyen).

- Háttér: klasszikus asztali türkiz (`#008080`) vagy szürke ablakkeret.
- Ablakok: `#c0c0c0` szürke felület, **bevel** keretek (kétrétegű fény/árnyék: fehér/világosszürke bal-felső, sötétszürke/fekete jobb-alsó). Beviteli/csempe-területek *inset* (süllyesztett) kerettel.
- Címsor: sötétkék → világoskék vízszintes gradiens, fehér félkövér szöveg, jobb oldalon `_ □ ✕` gombok (a ✕ a modál bezárása).
- Gombok: szögletes (`border-radius: 0`), lenyomott állapotban inset bevel, fókuszon szaggatott pontvonal.
- Betűtípus: `"Tahoma", "MS Sans Serif", Verdana, sans-serif` (rendszerfont), pixeles, kisebb méretek. A legacy téma szándékosan **nem** JetBrains Monót használ.
- Hangulatelemek: „Start" jellegű gomb a menüben, státuszsor az ablak alján (pl. `Attempts: 3/6`), betöltéskor homokóra kurzor, toast helyett „üzenetdoboz" stílusú párbeszédablak.
- Animáció minimális, nincs finom árnyék és lekerekítés.
- A legacy téma is ugyanazt az elrendezést és komponenseket használja, csak tokenek + legfeljebb pár `[data-theme="legacy"]` szintű felülírás. Nincs külön komponensfa.
- Szerzői jog: nem használunk eredeti Microsoft ikonokat, logókat, hangokat vagy betűfájlokat, csak hangulatában hasonló, saját rajzolású/CSS elemeket.

## Elrendezés

Mobile-first (360 px-től), a tábla középre igazítva, max. ~500 px széles. A rácsos tábla a szélesség alapján skálázódik (cellaméret `min()` alapján), a billentyűzet alul. A kijelölt szó kiemelt, a metszéspontok vizuálisan jelezettek.

## Mozgás és hang

Animáció kikapcsolható (`prefers-reduced-motion` + beállítás). Hang az első kiadásban nincs.
