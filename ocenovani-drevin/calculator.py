"""
Kalkulátor hodnoty stromu dle metodiky AOPK ČR.

Implementuje 9 kroků postupu pro oceňování solitérních stromů (sekce 2 metodiky)
a postup pro porost dřevin (sekce 4).
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional
import math

from data import tables
from data.taxons import find_taxon, is_coniferous


# =============================================================================
# Vstupní struktura pro výpočet stromu
# =============================================================================
@dataclass
class TreeInput:
    """Vstupní parametry pro výpočet hodnoty solitérního stromu."""
    # Specifikace taxonu
    taxon_latin: str            # latinský název ze seznamu taxonů
    deliberately_planted: bool = False  # výjimečné ocenění invazivního taxonu jako B

    # Dimenze kmene
    diameters_cm: list[float] = field(default_factory=list)  # průměry všech kmenů v cm
    dbh_on_stump: bool = False  # měřeno na pařezu? (přepočet d_1.3 = d_pařez / 1.37)

    # Dimenze koruny (volitelné - pokud chybí, krok 2 se vynechá)
    tree_height_m: Optional[float] = None       # výška stromu
    stem_height_m: Optional[float] = None       # výška nasazení koruny
    crown_spread_m: Optional[float] = None      # průměr koruny

    # Zdravotní stav a vitalita (povinné)
    vitality: int = 1            # 1-5
    health: int = 1              # 1-5

    # Nevhodný řez (volitelné)
    removed_crown_volume_pct: Optional[int] = None  # 10, 20, ..., 90

    # Atraktivita a růstové podmínky (povinné)
    location_attractiveness: str = 'medium'  # 'high', 'medium', 'less_significant', 'low', 'very_low'
    growth_conditions: str = 'unaffected'    # 'unaffected', 'good', 'impaired', 'extreme'

    # Památný strom
    memorial_tree: bool = False

    # Prvky se zvýšeným biologickým potenciálem
    # Klíče: 1-14 (viz METODIKA.md), valuable: pro klíče 4 a 9 znamená "rozsáhlý charakter"
    micro_habitats: list[int] = field(default_factory=list)
    valuable_micro_habitats: list[int] = field(default_factory=list)

    # Rok výpočtu (pro inflační koeficient)
    target_year: int = 2026


# =============================================================================
# Výsledková struktura
# =============================================================================
@dataclass
class TreeResult:
    """Výsledek výpočtu hodnoty stromu - hodnoty po jednotlivých krocích."""
    # Vstupy interpretované
    taxon: dict = field(default_factory=dict)
    effective_diameter_cm: float = 0.0     # výpočtový průměr po sloučení vícekmenů
    category: str = 'A'                    # výsledná kategorie pro výpočet
    crown_shape: Optional[str] = None      # tvar koruny použitý v kroku 2

    # Hodnoty po jednotlivých krocích (v bodech, cenová úroveň 2020)
    step_1_zbh: int = 0                    # základní hodnota
    step_2_after_crown: int = 0            # po zohlednění objemu koruny
    step_3_after_health: int = 0           # po zohlednění zdrav. stavu a vitality
    step_4_after_cut: int = 0              # po nevhodném řezu
    step_5_after_location: int = 0         # po polohovém koeficientu
    step_6_bio_value: int = 0              # bio potenciál (přidaná hodnota)
    step_7_after_taxon_bio: int = 0        # bio hodnota * koef významu taxonu
    step_8_final_points: int = 0           # finální bodová hodnota

    # Pomocné hodnoty
    real_crown_volume_m3: Optional[float] = None
    table_crown_volume_m3: Optional[float] = None
    health_coefficient: Optional[float] = None
    cut_coefficient: Optional[float] = None
    cut_reduction: int = 0                 # snížení hodnoty po nevhodném řezu
    location_coefficient: Optional[float] = None
    bio_points: int = 0
    bio_coefficient: Optional[float] = None
    taxon_bio_coefficient: Optional[float] = None

    # Bez biologického potenciálu (pro kompenzační rámec)
    value_without_bio_points: int = 0

    # Finální hodnota
    inflation_coefficient: float = 1.0
    value_in_czk: int = 0
    target_year: int = 2026

    # Pro případ poškození - hodnota bez nevhodného řezu (= "škoda")
    value_in_czk_without_cut: Optional[int] = None
    damage_in_czk: Optional[int] = None     # rozdíl = vzniklá újma


# =============================================================================
# Pomocné funkce
# =============================================================================
def compute_effective_diameter(diameters_cm: list[float], dbh_on_stump: bool) -> float:
    """Vrátí výpočtový průměr kmene v cm.

    - Pokud měřeno na pařezu: d_1.3 = d_pařez / 1.37
    - Vícekmen: d = sqrt(d_max^2 + d_ostatni^2)
    - Zaokrouhlení dle pravidel metodiky:
      * 1 cm mezi průměry 5-29 cm
      * 5 cm od průměru 30 cm
    """
    if not diameters_cm:
        return 0.0

    # Přepočet z pařezu, pokud relevantní
    if dbh_on_stump:
        diameters_cm = [d / 1.37 for d in diameters_cm]

    if len(diameters_cm) == 1:
        d = diameters_cm[0]
    else:
        d_max = max(diameters_cm)
        others = [x for x in diameters_cm if x != d_max] or diameters_cm[1:]
        if len(others) == 0:
            d = d_max
        else:
            d_others_avg = sum(others) / len(others)
            d = math.sqrt(d_max ** 2 + d_others_avg ** 2)

    # Zaokrouhlení na celý cm pro malé průměry
    if d < 30:
        return round(d)
    # Pro průměry >= 30 cm metodika zaokrouhluje na pásma po 5 cm
    # Zde necháme přesnou hodnotu - lookup tabulky zajistí správné pásmo
    return round(d)


def compute_bio_points(micro_habitats: list[int], valuable_micro_habitats: list[int]) -> int:
    """Vrátí součet bodů za mikrohabitaty.

    Každý mikrohabitat = 1 bod.
    Mikrohabitaty 4 (kmenové dutiny) a 9 (rozštípnuté dřevo) s "valuable" charakterem = 2 body.
    """
    if not micro_habitats:
        return 0
    points = 0
    for mh in micro_habitats:
        if mh in valuable_micro_habitats and mh in (4, 9):
            points += 2
        else:
            points += 1
    return points


def round_to_whole(value: float) -> int:
    """Matematicky zaokrouhlí na celé číslo (banker's rounding fix - vždy 0.5 nahoru)."""
    return int(math.floor(value + 0.5))


# =============================================================================
# Hlavní funkce výpočtu
# =============================================================================
def calculate_tree(inp: TreeInput) -> TreeResult:
    """Provede kompletní výpočet hodnoty solitérního stromu dle metodiky."""
    result = TreeResult(target_year=inp.target_year)

    # ---- Najdi taxon ----
    taxon = find_taxon(inp.taxon_latin)
    if taxon is None:
        raise ValueError(f"Neznámý taxon: {inp.taxon_latin}")
    result.taxon = dict(taxon)

    # Kategorie taxonu - pro D/B se rozhoduje dle deliberately_planted
    category = taxon['category']
    if category == 'D/B':
        category = 'B' if inp.deliberately_planted else 'D'
    if category not in ('A', 'B', 'C', 'D'):
        category = 'A'  # bezpečný fallback
    result.category = category

    # ---- Výpočtový průměr kmene ----
    diameter = compute_effective_diameter(inp.diameters_cm, inp.dbh_on_stump)
    result.effective_diameter_cm = diameter

    # ===== KROK 1: Základní hodnota stromu (ZBH) =====
    if diameter < 5:
        result.step_1_zbh = 0
    else:
        result.step_1_zbh = tables.get_zbh(int(round(diameter)), category)

    # ===== KROK 2: Zohlednění objemu koruny =====
    crown_shape = taxon.get('shape')
    result.crown_shape = crown_shape

    has_all_crown_params = (
        inp.tree_height_m is not None
        and inp.stem_height_m is not None
        and inp.crown_spread_m is not None
    )

    if diameter < 25 or crown_shape == 'jiny' or crown_shape is None or not has_all_crown_params:
        # Krok 2 se vynechává
        result.step_2_after_crown = result.step_1_zbh
    else:
        crown_height = inp.tree_height_m - inp.stem_height_m
        if crown_height <= 0:
            result.step_2_after_crown = result.step_1_zbh
        else:
            coniferous = is_coniferous(inp.taxon_latin)
            real_volume = tables.get_real_crown_volume(crown_height, inp.crown_spread_m, coniferous)
            table_volume = tables.get_table_crown_volume(int(round(diameter)), crown_shape)

            result.real_crown_volume_m3 = real_volume
            result.table_crown_volume_m3 = table_volume

            if real_volume >= table_volume:
                result.step_2_after_crown = result.step_1_zbh
            else:
                ratio = real_volume / table_volume
                result.step_2_after_crown = round_to_whole(result.step_1_zbh * ratio)

    # ===== KROK 3: Zohlednění zdravotního stavu a vitality =====
    health_coef = tables.TAB_5_HEALTH.get((inp.vitality, inp.health))
    if health_coef is None:
        raise ValueError(
            f"Neplatná kombinace vitality {inp.vitality} a zdravotního stavu {inp.health}"
        )
    result.health_coefficient = health_coef
    result.step_3_after_health = round_to_whole(result.step_2_after_crown * health_coef)

    # ===== KROK 4: Zohlednění nevhodného řezu =====
    if inp.removed_crown_volume_pct and inp.removed_crown_volume_pct > 0:
        regen = taxon['regenerability']
        cut_coef = tables.TAB_6_INAPPROPRIATE_CUT.get((regen, inp.vitality))
        if cut_coef is None:
            # Pro vitalitu 5 (suchý strom) - nevhodný řez se nepočítá
            result.step_4_after_cut = result.step_3_after_health
        else:
            result.cut_coefficient = cut_coef
            reduction = result.step_3_after_health * (inp.removed_crown_volume_pct / 100.0) * cut_coef
            result.cut_reduction = round_to_whole(reduction)
            result.step_4_after_cut = result.step_3_after_health - result.cut_reduction
    else:
        result.step_4_after_cut = result.step_3_after_health

    # ===== KROK 5: Zohlednění polohového koeficientu =====
    if inp.memorial_tree:
        loc_coef = tables.MEMORIAL_TREE_COEFFICIENT
    else:
        loc_coef = tables.TAB_7_LOCATION.get((inp.growth_conditions, inp.location_attractiveness))
        if loc_coef is None:
            raise ValueError(
                f"Neplatná kombinace růstových podmínek a atraktivity: "
                f"{inp.growth_conditions} / {inp.location_attractiveness}"
            )
    result.location_coefficient = loc_coef
    result.step_5_after_location = round_to_whole(result.step_4_after_cut * loc_coef)

    # ===== KROK 6-7-8: Biologický potenciál =====
    bio_points = compute_bio_points(inp.micro_habitats, inp.valuable_micro_habitats)
    result.bio_points = bio_points

    if bio_points < 2:
        # Krok 6, 7, 8 se vynechávají - výsledek = krok 5
        result.step_6_bio_value = 0
        result.step_7_after_taxon_bio = 0
        result.step_8_final_points = result.step_5_after_location
    else:
        bio_coef = tables.get_bio_potential_coefficient(bio_points)
        result.bio_coefficient = bio_coef
        result.step_6_bio_value = round_to_whole(result.step_1_zbh * bio_coef)

        taxon_bio = taxon.get('bio_significance', 'stredni')
        taxon_bio_coef = tables.TAB_9_TAXON_BIO_SIGNIFICANCE[taxon_bio]
        result.taxon_bio_coefficient = taxon_bio_coef
        result.step_7_after_taxon_bio = round_to_whole(result.step_6_bio_value * taxon_bio_coef)

        result.step_8_final_points = result.step_5_after_location + result.step_7_after_taxon_bio

    # Hodnota bez biologického potenciálu (pro stanovení korekčního rámce)
    result.value_without_bio_points = result.step_5_after_location

    # ===== KROK 9: Hodnota v Kč =====
    inflation = tables.get_inflation_coefficient(inp.target_year)
    result.inflation_coefficient = inflation
    result.value_in_czk = round_to_whole(result.step_8_final_points * inflation)

    # ===== Hodnota bez nevhodného řezu (= škoda) =====
    if inp.removed_crown_volume_pct and inp.removed_crown_volume_pct > 0:
        # Přepočítej kroky 5-8 bez kroku 4
        step_5_without_cut = round_to_whole(result.step_3_after_health * loc_coef)
        if bio_points >= 2:
            step_8_without_cut = step_5_without_cut + result.step_7_after_taxon_bio
        else:
            step_8_without_cut = step_5_without_cut
        result.value_in_czk_without_cut = round_to_whole(step_8_without_cut * inflation)
        result.damage_in_czk = result.value_in_czk_without_cut - result.value_in_czk

    return result


# =============================================================================
# Výpočet hodnoty porostu (sekce 4 metodiky)
# =============================================================================
@dataclass
class GroupInput:
    """Vstupní parametry pro výpočet hodnoty porostu dřevin."""
    character: str        # 'kere_nizke' / 'kere_vysoke' / 'liany' / 'porost_stromu_mlady' /
                          # 'porost_stromu_stredni' / 'porost_stromu_dospely' / 'porost_stromu_diferencovany'
    area_m2: float        # plocha porostu v m²

    suitability: str      # 'invazni' / 'nezadouci' / 'ostatni' / 'vhodne_skladby'
    cultivation: str      # 'zanedbany' / 'nevychovavany' / 'vychovavany'

    bio_value: str        # 'nizka' / 'stredni' / 'vysoka'
    location_attractiveness: str  # 'mene_vyznamna' / 'stredni' / 'vysoka'

    target_year: int = 2026


@dataclass
class GroupResult:
    step_1_base: int = 0
    step_2_after_quality: int = 0
    step_3_after_location: int = 0
    quality_coefficient: float = 0.0
    location_coefficient: float = 0.0
    inflation_coefficient: float = 1.0
    value_in_czk: int = 0


def calculate_group(inp: GroupInput) -> GroupResult:
    """Provede výpočet hodnoty porostu dřevin."""
    result = GroupResult()

    base_per_m2 = tables.TAB_10_GROUP_BASE_VALUE[inp.character]
    result.step_1_base = round_to_whole(inp.area_m2 * base_per_m2)

    q_coef = tables.TAB_12_GROUP_QUALITY[(inp.suitability, inp.cultivation)]
    result.quality_coefficient = q_coef
    result.step_2_after_quality = round_to_whole(result.step_1_base * q_coef)

    l_coef = tables.TAB_13_GROUP_LOCATION[(inp.bio_value, inp.location_attractiveness)]
    result.location_coefficient = l_coef
    result.step_3_after_location = round_to_whole(result.step_2_after_quality * l_coef)

    infl = tables.get_inflation_coefficient(inp.target_year)
    result.inflation_coefficient = infl
    result.value_in_czk = round_to_whole(result.step_3_after_location * infl)

    return result


# =============================================================================
# Helper - serializace výsledku
# =============================================================================
def result_to_dict(result: TreeResult) -> dict:
    """Převede TreeResult na slovník vhodný pro JSON serializaci."""
    return asdict(result)
