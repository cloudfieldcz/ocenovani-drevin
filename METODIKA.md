# Metodika AOPK ČR — Oceňování dřevin rostoucích mimo les

Zdroj: Kolařík, J. a kol. (2022): *Oceňování dřevin rostoucích mimo les včetně výpočtu kompenzačních opatření za kácené nebo poškozené dřeviny. Metodika AOPK ČR (4. vydání)*. Praha: Agentura ochrany přírody a krajiny ČR. 122 s. ISBN 978-80-7620-099-9.

Tento dokument je extrakt klíčových výpočetních pravidel pro implementaci kalkulačky. Pro plný kontext (popisy parametrů, fotografie pro vizuální určení) viz původní PDF.

---

## 2. Oceňování solitérních stromů — postup výpočtu

### Krok 1: Určení základní hodnoty (ZBH)

**Vstupy:** taxon (→ kategorie A/B/C/D), průměr kmene v cm (měřeno ve výčetní výšce 1,3 m).

**Kategorie taxonů:**
- **A** — převážně dlouhověké (mezní průměr nárůstu ZBH: 100 cm)
- **B** — krátkověké/pionýrské, příp. snadno nahraditelné (mezní průměr: 60 cm)
- **C** — malokorunné taxony / kultivary s pozměněnou charakteristikou tvaru koruny (mezní průměr: 30 cm)
- **D** — invazivní druhy (mezní průměr: 60 cm)

**Vícekmeny:** výpočet náhradního kmene `d = √(d_max² + d_ostatní²)`, kde `d_ostatní` je aritmetický průměr průměrů ostatních kmenů.

**Měření na pařezu:** `d_1.3 = d_pařez / 1.37`.

ZBH se odečte z **Tab. 2**. Pro průměry 5–25 cm po 1 cm, dále v pásmech (26–30, 31–35, ..., 96 a více).

### Krok 2: Zohlednění objemu koruny

**Vynechává se pro:**
- průměr kmene < 25 cm
- taxony s tvarem koruny "jiný" (kultivary s netypickou korunou)

**Postup:**
1. Změř výšku stromu, výšku nasazení koruny, průměr koruny
2. **Výška koruny** = výška stromu − výška nasazení koruny
3. Z **Tab. 3a** (listnaté) nebo **Tab. 3b** (jehličnaté) odečti skutečný objem koruny podle výšky koruny a průměru koruny (v m³)
4. Z taxonu zjisti tvar koruny (kuželovitá / sloupovitá / zaoblená / kulovitá). U jehličnatých vždy kuželovitá.
5. Z **Tab. 4** odečti tabulkový objem koruny podle průměru kmene a tvaru koruny

**Úprava ZBH:**
- Pokud `skutečný_objem ≥ tabulkový_objem` → ZBH se nemění
- Jinak: `ZBH_nová = ZBH × (skutečný_objem / tabulkový_objem)`
- Výsledek zaokrouhli matematicky na celé.

### Krok 3: Zohlednění zdravotního stavu a vitality

**Vstupy:**
- **Vitalita** (1–5): 1 = výborná, 2 = zřetelně snížená, 3 = výrazně snížená, 4 = zbytková, 5 = suchý strom
- **Zdravotní stav** (1–5): 1 = výborný, 2 = zhoršený, 3 = výrazně zhoršený, 4 = silně narušený, 5 = havarijní/rozpadlý

Koeficient z **Tab. 5** se vynásobí výsledkem kroku 2.

Některé kombinace jsou neplatné (vitalita 1 × zdravotní stav 5, vitalita 5 × zdravotní stav 1).

### Krok 4: Zohlednění nevhodného řezu

Pouze pokud byl strom poškozen nevhodným řezem.

**Vstupy:**
- **Odebraný objem koruny** v % (po desítkách: 10, 20, ..., 90)
- Vitalita, regenerovatelnost taxonu (vysoká/střední/nízká z Tab. 1)

**Postup:**
- Z **Tab. 6** odečti koeficient
- `snížení = ZBH_po_kroku_3 × (odebraný_objem_%/100) × koeficient_tab6`
- `ZBH_po_kroku_4 = ZBH_po_kroku_3 − snížení`

### Krok 5: Zohlednění polohového koeficientu

**Vstupy:**
- **Atraktivita umístění:** vysoká / střední / méně významná / nízká / velmi nízká
- **Růstové podmínky:** neovlivněné / dobré / zhoršené / extrémní

Koeficient z **Tab. 7** (rozsah 0,03–1,0). U **památného stromu** (§ 46 zákona 114/1992 Sb.) je polohový koeficient roven **2,0**.

Vynásobí se výsledkem kroku 4.

### Krok 6: Zohlednění prvků se zvýšeným biologickým potenciálem (mikrohabitatů)

**Pouze pokud bodový součet prvků ≥ 2 body**, jinak se vynechá krok 6, 7 i 8 a pokračuje se krokem 9.

**Prvky** (každý 1 bod, prvky označené * mohou mít při extenzivním charakteru 2 body):
1. Dutiny od ptáků
2. Dutiny po větvích
3. Hmyzí galerie a otvory
4. **Kmenové dutiny** (*)
5. Odlupující/odchylující se borka
6. Pahýly po větvích
7. Plodnice hub
8. Poškození borky
9. **Přítomnost rozštípnutého dřeva** (*)
10. Suché odumřelé větve
11. Trhliny a nezahojené jizvy
12. Vodní kapsy
13. Výtoky mízy a exudátů
14. Zduřené, členité kořenové náběhy

**Tab. 8:**
- 2–3 body → koef 0,1
- 4–6 bodů → koef 0,2
- 7 a více → koef 0,3

**Bio_hodnota_kroku_6 = ZBH_z_kroku_1 × koef_Tab8**

### Krok 7: Zohlednění biologického významu taxonu

Z **Tab. 1** zjisti biologický význam taxonu (nízký/střední/vysoký).

**Tab. 9:**
- nízký → 0,6
- střední → 0,8
- vysoký → 1,0

`Bio_hodnota_kroku_7 = Bio_hodnota_kroku_6 × koef_Tab9`

### Krok 8: Výpočet základní hodnoty s prvky se zvýšeným biopotenciálem

`Hodnota_kroku_8 = Hodnota_kroku_5 + Bio_hodnota_kroku_7`

### Krok 9: Výpočet hodnoty stromu v Kč

`Hodnota_v_Kč = Hodnota_kroku_8 × inflační_koeficient`

Hodnoty v textu metodiky jsou v cenové úrovni roku 2020. Od verze 2021 se pro přepočet na aktuální rok používá průměrná roční míra inflace (CPI) z ČSÚ:
- Od roku 2023 se hodnota přepočte inflačním koeficientem dostupným k 1. 1. daného roku, tj. cenová úroveň zaostává o ~2 roky.

Roční míra inflace (ČSÚ, průměr):
- 2021: 3,8 %
- 2022: 15,1 %
- 2023: 10,7 %
- 2024: ~2,4 %
- 2025: ~2,5 %

**Výsledná hodnota se matematicky zaokrouhlí na celé koruny.**

---

## 4. Oceňování porostu dřevin

Stromy s obvodem kmene > 80 cm (≈ průměr 25 cm) v porostu se oceňují **individuálně** metodikou solitérních stromů.

Stromy a skupiny s menším průměrem se oceňují jako porost.

### Krok 1: Určení základní hodnoty porostu

**Vstupy:** charakter porostu a rozloha v m².

**Tab. 10 — základní hodnota za 1 m²:**
- Keře nízké: 810 Kč
- Keře vysoké: 520 Kč
- Liány: 650 Kč
- Porost stromů — mladý: 430 Kč
- Porost stromů — středního věku: 600 Kč
- Porost stromů — dospívající a dospělý: 810 Kč
- Porost stromů — věkově a prostorově diferencovaný: 650 Kč

`ZBH_porost = plocha_m² × hodnota_za_m²`

### Krok 2: Vhodnost a pěstební stav

**Vhodnost porostu:** invazní / nežádoucí / ostatní / vhodné skladby
**Pěstební stav:** pěstebně zanedbaný / průběžně nevychovávaný / vychovávaný

Koeficient z **Tab. 12** (0–1).

### Krok 3: Atraktivita umístění a biologická hodnota

**Atraktivita umístění porostu:** méně významná / střední / vysoká
**Biologická hodnota porostu:** nízká / střední / vysoká

Koeficient z **Tab. 13** (0,2–1,0).

### Krok 4: Výpočet v Kč

Vynásobit inflačním koeficientem (jako u kroku 9 stromu).

---

## 6. Kompenzační opatření

Kompenzační opatření kompenzují společenskou/ekologickou újmu vzniklou kácením nebo poškozením. Vstupem je hodnota stromu vypočtená ve výše uvedené metodice (bez přepočtu inflačním koeficientem — hodnoty kompenzací jsou rovněž v cenové úrovni 2020).

### Krok 1: Korekční rámec

- 0–300 000 bodů → ±10 %
- 300 001–600 000 bodů → ±5 %
- 600 001 a více → ±2 %

Korekční rámec lze využít pouze pro **mírné překročení** základní hodnoty (nelze násobně přidávat opatření do horní hranice).

### Krok 2: Typ kompenzačního opatření

- **Výsadby:** stromů / keřů / popínavých dřevin
- **Pěstební opatření** (řez stromů, instalace bezpečnostních vazeb)

### Kroky 3–5: Výsadby

**Skupiny taxonů (Tab. 14a–14e):**
- 14a: Listnaté stromy I (rychlerostoucí, krátkověké)
- 14b: Listnaté stromy II
- 14c: Listnaté stromy III (vzácné)
- 14d: Jehličnaté stromy I
- 14e: Jehličnaté stromy II
- + Listnaté keře, Jehličnaté keře

**Velikostní kategorie:**
- Listnaté stromy: 100/150, 150/200, 200/250 (špičáky podle výšky v cm), 10/12, 12/14, 14/16, 16/18, 18/20, 20/25 (stromy se zapěstovanou korunou podle obvodu kmene)
- Jehličnaté stromy: 100/125, 125/150, 150/175, 175/200, 200/225, 225/250, 250/300 (výška v cm)
- Keře: kontejner 1l, 2l, 3l

**Délka povýsadbové péče:**
- Keře: 3 roky
- Stromy 100/150 – 250/300: 3 roky
- Stromy 10/12 – 20/25: 5 let

**Hodnota = počet × základní_hodnota (Tab. 15)**

### Krok 6: Pěstební opatření

**Výchovný řez (S-RV):** vstupy = výška stromu, počet stromů (Tab. 16)
**Zdravotní řez (S-RZ):** vstupy = výška, průměr koruny, počet (Tab. 17, dle Ips = výška × průměr)
**Bezpečnostní řez (S-RB):** stejné jako S-RZ (Tab. 18)
**Lokální redukce (S-RLLR, S-RLSP, S-RLPV):** vstupy = výška, průměr, počet čtvrtin koruny, počet stromů (Tab. 19, pro 1/4 koruny)
**Obvodová redukce (S-RO):** vstupy = výška, průměr koruny, počet (Tab. 20)
**Statická vazba (S-VSH, S-USD):** počet vazeb (Tab. 21)
**Dynamická vazba (S-VDD, S-VDH):** počet vazeb (Tab. 22)

### Krok 7–8: Kontrola

Po sčítání hodnot kompenzačních opatření se kontroluje, zda celková hodnota leží v korekčním rámci hodnoty stromu (resp. újmy).

---

## Případová studie (validace implementace)

**Borovice lesní** (*Pinus sylvestris*) — kategorie A:
- průměr kmene 62 cm → ZBH = 481 180 Kč
- výška stromu 15 m, výška nasazení koruny 2 m → výška koruny 13 m
- průměr koruny 8 m → skutečný objem koruny = 217 m³ (Tab. 3b)
- pro 61–65 cm kuželovitá koruna → tabulkový objem 346 m³ (Tab. 4)
- po kroku 2: 481180 × 217/346 = **301 781**
- vitalita 1, zdravotní stav 3 → koef 0,6 → po kroku 3: **181 069**
- bez nevhodného řezu (krok 4 se neřeší)
- atraktivita méně významná, podmínky neovlivněné → koef 0,4 → po kroku 5: **72 428**
- bez biologického potenciálu (krok 6–8 se neřeší)
- pro roky 2021–2022: **72 428 Kč** (cenová úroveň 2020)
