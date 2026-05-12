"""
Unit testy pro kalkulátor hodnoty stromu dle metodiky AOPK ČR.

Hlavní test (test_case_study_solitary_tree) ověřuje výpočet proti případové studii
z metodiky (strana 51-52), borovice lesní s průměrem kmene 62 cm.

Spuštění:
    cd ocenovani-drevin && pytest tests/
nebo
    cd ocenovani-drevin && python -m unittest tests/test_calculator.py
"""
from __future__ import annotations
import math
import sys
from pathlib import Path

# Umožní spuštění bez instalace - přidá rodičovský adresář do sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest

from calculator import (
    TreeInput, TreeResult, calculate_tree,
    GroupInput, GroupResult, calculate_group,
    compute_effective_diameter, compute_bio_points,
)
from data import tables
from data.taxons import find_taxon


# =============================================================================
# Případová studie z metodiky AOPK ČR (strana 51-52)
# =============================================================================
class TestCaseStudySolitaryTree:
    """
    Borovice lesní (Pinus sylvestris), kategorie A
    - průměr kmene 62 cm
    - výška stromu 15 m, výška nasazení koruny 2 m
    - průměr koruny 8 m
    - vitalita 1, zdravotní stav 3 (výrazně zhoršený)
    - atraktivita umístění méně významná, růstové podmínky neovlivněné
    - bez nevhodného řezu, bez biopotenciálu

    Metodika uvádí (cenová úroveň 2020):
    - Krok 1: ZBH = 481 180
    - Krok 2: ~301 781  (skut. objem 217 m³ / tab. objem 346 m³)
    - Krok 3: ~181 069  (koef 0,6)
    - Krok 5: ~72 428   (koef 0,4)
    - Finální hodnota Kč pro 2021/2022: 72 428

    Pozn. Metodika v textu uvádí skutečný objem koruny 217 m³, ale samotná Tab. 3b
    pro výšku koruny 13 m a průměr koruny 8 m uvádí 218 m³. Náš výpočet pracuje
    s hodnotami z tabulky (218), proto je výsledek nepatrně vyšší. Rozdíl ~0,5 %
    je v rámci tolerance metodiky (zaokrouhlování).
    """

    @pytest.fixture
    def tree_input(self) -> TreeInput:
        return TreeInput(
            taxon_latin='Pinus sylvestris',
            diameters_cm=[62],
            tree_height_m=15,
            stem_height_m=2,
            crown_spread_m=8,
            vitality=1,
            health=3,
            location_attractiveness='less_significant',
            growth_conditions='unaffected',
            target_year=2022,  # cenová úroveň 2020 (bez inflace)
        )

    def test_taxon_resolution(self, tree_input):
        r = calculate_tree(tree_input)
        assert r.taxon['cz'] == 'borovice lesní'
        assert r.taxon['la'] == 'Pinus sylvestris'
        assert r.category == 'A'
        assert r.crown_shape == 'kuzelovita'

    def test_step_1_basic_value(self, tree_input):
        r = calculate_tree(tree_input)
        # Tab. 2: průměr 61-65 cm, kategorie A → 481 180
        assert r.step_1_zbh == 481_180

    def test_step_2_crown_volume(self, tree_input):
        r = calculate_tree(tree_input)
        # Tab. 3b: výška koruny 13 m, průměr 8 m → 218 m³ (metodika v textu uvádí 217 - drobná nekonzistence)
        # Tab. 4: průměr 61-65 cm, kuželovitá koruna → 346 m³
        assert r.real_crown_volume_m3 in (217, 218)
        assert r.table_crown_volume_m3 == 346
        # 481180 * 218 / 346 = 303170.5 → 303171 (matematicky zaokrouhleno)
        # Metodika udává 301 781 (s 217 m³)
        expected_metodika = 301_781
        # Akceptujeme rozdíl do 1 % vzhledem k nekonzistenci v metodice
        assert abs(r.step_2_after_crown - expected_metodika) / expected_metodika < 0.01

    def test_step_3_health(self, tree_input):
        r = calculate_tree(tree_input)
        assert r.health_coefficient == 0.6
        # Tolerance: metodika 181 069, naše implementace ~181 903
        assert abs(r.step_3_after_health - 181_069) / 181_069 < 0.01

    def test_step_4_no_cut(self, tree_input):
        """Bez nevhodného řezu se krok 4 neaplikuje."""
        r = calculate_tree(tree_input)
        assert r.step_4_after_cut == r.step_3_after_health
        assert r.cut_coefficient is None

    def test_step_5_location(self, tree_input):
        r = calculate_tree(tree_input)
        # Tab. 7: neovlivněné × méně významná → 0.4
        assert r.location_coefficient == 0.4
        # Metodika: 72 428 (s 217 m³), naše implementace: ~72 761 (s 218 m³)
        assert abs(r.step_5_after_location - 72_428) / 72_428 < 0.01

    def test_step_6_8_no_bio(self, tree_input):
        r = calculate_tree(tree_input)
        # Bez biopotenciálu → kroky 6-8 se vynechají
        assert r.bio_points == 0
        assert r.step_6_bio_value == 0
        assert r.step_7_after_taxon_bio == 0
        assert r.step_8_final_points == r.step_5_after_location

    def test_final_value_2022(self, tree_input):
        """Pro rok 2022 - cenová úroveň zůstává 2020 (inflační koef = 1.0)."""
        r = calculate_tree(tree_input)
        assert r.inflation_coefficient == 1.0
        # Metodika: 72 428 Kč, my: ~72 761 Kč (rozdíl 0,5 %)
        assert abs(r.value_in_czk - 72_428) / 72_428 < 0.01


# =============================================================================
# Test: jednotlivé komponenty
# =============================================================================
class TestZBHLookup:
    """Test základní hodnoty stromu (Tab. 2)."""

    def test_small_diameter_category_a(self):
        assert tables.get_zbh(5, 'A') == 3_030
        assert tables.get_zbh(10, 'A') == 12_130
        assert tables.get_zbh(25, 'A') == 75_770

    def test_range_lookup(self):
        # Pásmo 26-30
        assert tables.get_zbh(26, 'A') == 95_290
        assert tables.get_zbh(30, 'A') == 95_290
        # Pásmo 31-35
        assert tables.get_zbh(31, 'A') == 132_030
        assert tables.get_zbh(35, 'A') == 132_030

    def test_category_b_smaller_than_a(self):
        # Kategorie B je vždy nižší než A (krátkověké druhy)
        for d in [5, 10, 25, 50]:
            assert tables.get_zbh(d, 'B') < tables.get_zbh(d, 'A')

    def test_category_d_lowest(self):
        # Invazivní druhy mají nejnižší hodnotu
        for d in [5, 10, 25]:
            assert tables.get_zbh(d, 'D') < tables.get_zbh(d, 'B')

    def test_category_c_capped_at_30(self):
        # Kategorie C má strop u průměru 30 cm
        assert tables.get_zbh(30, 'C') == tables.get_zbh(50, 'C') == 128_610

    def test_max_diameter(self):
        # Strop pro kategorii A je při průměru 96+ cm
        assert tables.get_zbh(96, 'A') == 1_164_350
        assert tables.get_zbh(200, 'A') == 1_164_350


class TestEffectiveDiameter:
    """Výpočet výpočtového průměru kmene."""

    def test_single_stem(self):
        assert compute_effective_diameter([50], False) == 50

    def test_dbh_on_stump_conversion(self):
        # d_1.3 = d_pařez / 1.37
        result = compute_effective_diameter([68.5], True)
        # 68.5 / 1.37 = 50
        assert result == 50

    def test_multi_stem(self):
        # d = sqrt(d_max^2 + d_ostatni^2)
        # Pro [40, 30, 30]: d_max=40, d_ostatni_avg=30 → sqrt(40²+30²)=50
        assert compute_effective_diameter([40, 30, 30], False) == 50

    def test_two_stems(self):
        # [30, 40]: d_max=40, d_ostatni=30 → sqrt(40²+30²)=50
        assert compute_effective_diameter([30, 40], False) == 50


class TestBioPoints:
    """Bodování mikrohabitatů."""

    def test_no_habitats(self):
        assert compute_bio_points([], []) == 0

    def test_single_habitats(self):
        assert compute_bio_points([1, 2, 3], []) == 3

    def test_valuable_habitat_4(self):
        # Kmenové dutiny (4) s rozsáhlým charakterem = 2 body
        assert compute_bio_points([4], [4]) == 2
        # Bez extenzivního charakteru = 1 bod
        assert compute_bio_points([4], []) == 1

    def test_valuable_habitat_9(self):
        # Rozštípnuté dřevo (9) s rozsáhlým charakterem = 2 body
        assert compute_bio_points([9], [9]) == 2

    def test_mixed(self):
        # 4 normální + 1 vzácný extenzivní = 4 + 2 = 6
        assert compute_bio_points([1, 2, 3, 4, 9], [9]) == 6


class TestBioPotentialCoefficient:
    """Tab. 8: koeficient dle bodů biopotenciálu."""

    def test_below_threshold(self):
        # Pod 2 body = krok 6-8 se vynechá
        assert tables.get_bio_potential_coefficient(0) == 0.0
        assert tables.get_bio_potential_coefficient(1) == 0.0

    def test_low_range(self):
        # 2-3 body → 0.1
        assert tables.get_bio_potential_coefficient(2) == 0.1
        assert tables.get_bio_potential_coefficient(3) == 0.1

    def test_medium_range(self):
        # 4-6 bodů → 0.2
        assert tables.get_bio_potential_coefficient(4) == 0.2
        assert tables.get_bio_potential_coefficient(6) == 0.2

    def test_high_range(self):
        # 7+ → 0.3
        assert tables.get_bio_potential_coefficient(7) == 0.3
        assert tables.get_bio_potential_coefficient(100) == 0.3


class TestMemorialTree:
    """Památný strom má polohový koeficient 2.0."""

    def test_memorial_tree_coefficient(self):
        inp = TreeInput(
            taxon_latin='Quercus robur',
            diameters_cm=[50],
            vitality=1, health=1,
            memorial_tree=True,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.location_coefficient == 2.0
        # Bez krok 2 (chybí výška) - krok 5 = ZBH * 2
        assert r.step_5_after_location == r.step_1_zbh * 2


class TestInappropriateCut:
    """Test krok 4 - nevhodný řez."""

    def test_no_cut(self):
        inp = TreeInput(
            taxon_latin='Quercus robur',
            diameters_cm=[30],
            vitality=1, health=1,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.step_4_after_cut == r.step_3_after_health
        assert r.cut_reduction == 0

    def test_50pct_cut_high_regen(self):
        # Quercus robur má regenerovatelnost 'vysoka', při vitalitě 1 → koef 0.2
        inp = TreeInput(
            taxon_latin='Quercus robur',
            diameters_cm=[30],
            vitality=1, health=1,
            removed_crown_volume_pct=50,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.cut_coefficient == 0.2
        # Snížení = krok_3 * 0.5 * 0.2 = krok_3 * 0.1
        expected_reduction = round(r.step_3_after_health * 0.1)
        assert abs(r.cut_reduction - expected_reduction) <= 1

    def test_damage_calculation(self):
        """Při poškození vrátí kalkulátor i hodnotu bez řezu (= výše újmy)."""
        inp = TreeInput(
            taxon_latin='Quercus robur',
            diameters_cm=[30],
            vitality=1, health=1,
            removed_crown_volume_pct=50,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.value_in_czk_without_cut is not None
        assert r.damage_in_czk is not None
        assert r.value_in_czk_without_cut > r.value_in_czk
        assert r.damage_in_czk == r.value_in_czk_without_cut - r.value_in_czk


class TestSmallTreeNoStep2:
    """Strom < 25 cm průměru - krok 2 se vynechá."""

    def test_small_tree(self):
        inp = TreeInput(
            taxon_latin='Tilia cordata',
            diameters_cm=[20],
            tree_height_m=8, stem_height_m=2, crown_spread_m=4,
            vitality=1, health=1,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.real_crown_volume_m3 is None  # krok 2 vynechán
        assert r.step_2_after_crown == r.step_1_zbh


class TestCultivarShapeJiny:
    """Kultivary s tvarem 'jiny' - krok 2 se vynechá i pro velké stromy."""

    def test_cultivar_no_crown_step(self):
        # Quercus robur 'Fastigiata' má shape 'jiny'
        inp = TreeInput(
            taxon_latin="Quercus robur 'Fastigiata'",
            diameters_cm=[40],
            tree_height_m=10, stem_height_m=1, crown_spread_m=3,
            vitality=1, health=1,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.crown_shape == 'jiny'
        assert r.step_2_after_crown == r.step_1_zbh


class TestMultiStem:
    """Vícekmen - výpočet náhradního průměru."""

    def test_multistem_diameter(self):
        # 3 kmeny: 40, 30, 30 cm → d = sqrt(40² + 30²) = 50 cm
        inp = TreeInput(
            taxon_latin='Pinus sylvestris',
            diameters_cm=[40, 30, 30],
            vitality=1, health=1,
            target_year=2022,
        )
        r = calculate_tree(inp)
        assert r.effective_diameter_cm == 50


class TestGroupValuation:
    """Test výpočtu hodnoty porostu (sekce 4 metodiky)."""

    def test_case_study_group(self):
        """
        Případová studie porostu (str. 63-64 metodiky):
        - porost dospívající a dospělý, plocha 3×20 = 60 m²
        - vhodné skladby, pěstebně zanedbaný
        - vysoká biol. hodnota, vysoká atraktivita umístění
        Očekávané:
        - krok 1: 60 × 810 = 48 600
        - krok 2: 48 600 × 0,7 = 34 020
        - krok 3: 34 020 × 1,0 = 34 020
        """
        inp = GroupInput(
            character='porost_stromu_dospely',
            area_m2=60,
            suitability='vhodne_skladby',
            cultivation='zanedbany',
            bio_value='vysoka',
            location_attractiveness='vysoka',
            target_year=2022,
        )
        r = calculate_group(inp)
        assert r.step_1_base == 48_600
        assert r.quality_coefficient == 0.7
        assert r.step_2_after_quality == 34_020
        assert r.location_coefficient == 1.0
        assert r.step_3_after_location == 34_020
        assert r.value_in_czk == 34_020


class TestInflation:
    """Test inflačního koeficientu (krok 9)."""

    def test_2021_2022_no_inflation(self):
        # Pro roky 2021 a 2022 se cenová úroveň 2020 nepřepočítává
        assert tables.get_inflation_coefficient(2021) == 1.0
        assert tables.get_inflation_coefficient(2022) == 1.0

    def test_2023_uses_2021_inflation(self):
        # Pro rok 2023 se aplikuje inflace z roku 2021 (3.8 %)
        assert abs(tables.get_inflation_coefficient(2023) - 1.038) < 0.001

    def test_2024_cumulative(self):
        # 2024: inflace 2021 + 2022 = 1.038 × 1.151 = 1.1948
        expected = 1.038 * 1.151
        assert abs(tables.get_inflation_coefficient(2024) - expected) < 0.01


# =============================================================================
# Test: invalidní vstupy
# =============================================================================
class TestInvalidInputs:

    def test_unknown_taxon(self):
        inp = TreeInput(
            taxon_latin='Nonexistent species',
            diameters_cm=[30],
            target_year=2022,
        )
        with pytest.raises(ValueError, match='Neznámý taxon'):
            calculate_tree(inp)

    def test_invalid_health_vitality_combo(self):
        # Vitalita 1 + zdravotní stav 5 je v Tab. 5 značeno jako 'x' (neplatná)
        inp = TreeInput(
            taxon_latin='Pinus sylvestris',
            diameters_cm=[30],
            vitality=1, health=5,
            target_year=2022,
        )
        with pytest.raises(ValueError, match='Neplatná kombinace vitality'):
            calculate_tree(inp)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
