# Oceňování dřevin — kalkulačka

Webová kalkulačka pro ocenění hodnoty dřevin rostoucích mimo les dle **Metodiky AOPK ČR** (Kolařík et al., 2022, 4. vydání).

Implementuje:
- Postup oceňování solitérních stromů (9 kroků dle sekce 2 metodiky)
- Postup oceňování porostu dřevin (sekce 4)
- Výpočet kompenzačních opatření (sekce 6) — výsadby a pěstební opatření

Backend je FastAPI (Python), frontend je čisté HTML/CSS/JS bez build kroku.

## Rychlý start

Projekt používá [`uv`](https://docs.astral.sh/uv/) pro správu závislostí.

```bash
# instalace závislostí + spuštění serveru
uv sync
uv run uvicorn main:app --reload

# alternativně přímo přes entry-point ze skriptu
uv run python main.py
```

Server běží na `http://127.0.0.1:8000`. Nové UI zatím není připravené (root `/` vrací 404); původní formulář je dostupný na `/old-ui`.

| Endpoint | Popis |
|---|---|
| `GET /old-ui` | Původní HTML formulář (frontend) |
| `GET /api/taxons` | Seznam ~300 taxonů (Tab. 1 metodiky) |
| `POST /api/calculate` | Výpočet hodnoty solitérního stromu (9 kroků) |
| `POST /api/group` | Výpočet hodnoty porostu dřevin |
| `POST /api/compensation` | Výpočet kompenzačních opatření |
| `GET /api/year-info` | Inflační koeficient pro daný rok |
| `GET /api/sizes/{group}` | Velikostní kategorie výsadeb pro skupinu |
| `GET /docs` | Swagger UI (automatická OpenAPI dokumentace) |

## Testy

```bash
uv run pytest tests/ -v
```

40 testů včetně ověření proti případové studii z metodiky (borovice lesní, 62 cm → ~72 428 Kč).

## Struktura projektu

```
ocenovani-drevin/
├── README.md                  — tento soubor
├── METODIKA.md                — extrakt klíčových výpočetních pravidel z PDF
├── metodika.pdf               — zdrojová metodika AOPK ČR (2022)
├── pyproject.toml             — konfigurace projektu pro uv
├── main.py                    — FastAPI server, REST endpointy
├── calculator.py              — výpočet stromu (TreeInput → TreeResult) + porost
├── compensation.py            — kompenzační opatření + korekční rámec
├── data/
│   ├── tables.py              — všechny tabulky z metodiky (Tab. 2-22)
│   └── taxons.py              — seznam ~300 taxonů s kategoriemi A/B/C/D
├── tests/
│   └── test_calculator.py     — 40 unit testů (pytest)
└── static/
    └── old-ui/                — původní UI, dostupné na /old-ui
        ├── index.html         — HTML formulář
        ├── style.css          — styling
        └── app.js             — frontend logika
```

## Postup výpočtu (9 kroků metodiky)

1. **Základní hodnota (ZBH)** — z Tab. 2 podle průměru kmene a kategorie taxonu (A/B/C/D)
2. **Objem koruny** — úprava ZBH dle reálného objemu koruny vůči tabulkovému (Tab. 3a/3b, Tab. 4)
3. **Vitalita × zdravotní stav** — koeficient z Tab. 5
4. **Nevhodný řez** — odečtení dle Tab. 6 (regenerovatelnost × vitalita × % odebraného)
5. **Polohový koeficient** — Tab. 7 (atraktivita × růstové podmínky) nebo `2,0` pro památný strom
6. **Biopotenciál** — Tab. 8 (přidaná hodnota dle mikrohabitatů, jen pokud ≥ 2 body)
7. **Biologický význam taxonu** — Tab. 9
8. **Součet** — krok 5 + krok 7
9. **Hodnota v Kč** — vynásobení inflačním koeficientem (CPI od roku 2020)

## Inflační koeficient

Metodika udává hodnoty v cenové úrovni 2020. Od roku 2023 se hodnota přepočítává inflačním koeficientem dostupným k 1. 1. daného roku — viz `data/tables.py` (`ANNUAL_INFLATION`):

| Rok | Roční CPI | Kumulativní koef pro výpočet |
|-----|-----------|------------------------------|
| 2021, 2022 | — | 1.0000 |
| 2023 | 3,8 % (2021) | 1.0380 |
| 2024 | + 15,1 % (2022) | 1.1948 |
| 2025 | + 10,7 % (2023) | 1.3226 |
| 2026 | + 2,4 % (2024) | 1.3543 |

Hodnoty `ANNUAL_INFLATION` aktualizuj podle [ČSÚ](https://www.czso.cz/csu/czso/mira_inflace).

## Případová studie (validace)

Borovice lesní (`Pinus sylvestris`), průměr kmene 62 cm:
- ZBH = 481 180 Kč (Tab. 2, kategorie A)
- Po objemu koruny: ~301 781 Kč (objem 217/346 m³)
- Po vitalitě/zdravotním stavu (1×3, koef 0,6): ~181 069 Kč
- Po polohovém koeficientu (méně významná × neovlivněné, koef 0,4): ~72 428 Kč
- Hodnota Kč pro rok 2022 (bez inflace): **72 428 Kč**

Naše implementace dosahuje ~72 761 Kč (rozdíl 0,5 %) — drobná nekonzistence mezi textem případové studie (217 m³) a tabulkou 3b (218 m³) v samotné metodice. Test ověřuje shodu v rámci 1% tolerance.

## Omezení a TODO

- Některé položky seznamu taxonů (kultivary) mohou mít odlišný tvar koruny než v originální tabulce (zjednodušení implementace) — pro produkční použití dovést úplnost
- Nezohledňuje rozšířené pravidlo: u průměrů 30+ cm metodika zaokrouhluje na pásma po 5 cm — naše implementace mapuje vstupní hodnotu na nejbližší pásmo přes lookup
- Inflační koeficient 2025 je odhad; aktualizuj dle ČSÚ
- Frontend je MVP — bez tisku protokolu (jako u nature.cz)

## Licence a zdroje

Implementace volně dle:

> Kolařík, J. a kol. (2022): *Oceňování dřevin rostoucích mimo les včetně výpočtu kompenzačních opatření za kácené nebo poškozené dřeviny. Metodika AOPK ČR (4. vydání)*. Praha: Agentura ochrany přírody a krajiny ČR. 122 s. ISBN 978-80-7620-099-9.

Reference k online kalkulačce AOPK: <https://ocenovanidrevin.nature.cz/strom.html>
