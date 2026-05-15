"""
Kompenzační opatření dle metodiky AOPK ČR (sekce 6).

Implementuje:
- Korekční rámec (krok 1)
- Výsadby stromů a keřů (kroky 3-5)
- Pěstební opatření: řezy a bezpečnostní vazby (krok 6)
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional
import math

from data import tables
from data.taxons import find_taxon


def round_to_whole(value: float) -> int:
    return int(math.floor(value + 0.5))


# =============================================================================
# Krok 1: Korekční rámec
# =============================================================================
def get_correction_frame_pct(base_points: int) -> float:
    """Vrátí korekční rámec v procentech (jednostranný) podle základní hodnoty."""
    if base_points <= 300_000:
        return 10.0
    if base_points <= 600_000:
        return 5.0
    return 2.0


def get_correction_frame_bounds(base_points: int) -> tuple[int, int]:
    """Vrátí (min, max) bodů, ve kterých může ležet kompenzace v rámci korekce."""
    pct = get_correction_frame_pct(base_points)
    delta = round_to_whole(base_points * pct / 100.0)
    return (base_points - delta, base_points + delta)


# =============================================================================
# Výsadby - velikostní kategorie podle skupin
# =============================================================================
# Hodnota = počet × základní_hodnota_z_Tab_15

SIZE_CATEGORIES = {
    'ls1': ['100/150', '150/200', '200/250', '10/12', '12/14', '14/16', '16/18', '18/20', '20/25'],
    'ls2': ['100/150', '150/200', '200/250', '10/12', '12/14', '14/16', '16/18', '18/20', '20/25'],
    'ls3': ['100/150', '150/200', '200/250', '10/12', '12/14', '14/16', '16/18', '18/20', '20/25'],
    'js1': ['100/125', '125/150', '150/175', '175/200', '200/225', '225/250', '250/300'],
    'js2': ['100/125', '125/150', '150/175', '175/200', '200/225', '225/250', '250/300'],
    'lk':  ['1l', '2l', '3l'],
    'jk':  ['1l', '2l', '3l'],
}


def get_default_care_length_years(size: str) -> int:
    """Doporučená délka povýsadbové péče v letech."""
    # Stromy s velikostí 10/12 - 20/25 mají péči 5 let, ostatní 3 roky
    tree_5y = {'10/12', '12/14', '14/16', '16/18', '18/20', '20/25'}
    if size in tree_5y:
        return 5
    return 3


@dataclass
class OutplantingItem:
    """Jedna položka výsadby v rámci kompenzačních opatření."""
    group: str            # 'ls1' / 'ls2' / 'ls3' / 'js1' / 'js2' / 'lk' / 'jk'
    size: str             # velikostní kategorie (např. '12/14' nebo '1l')
    count: int            # počet sazenic
    care_length_years: int = 5
    taxon_latin: Optional[str] = None  # volitelný taxon
    species: Optional[str] = None      # volitelný druh keře (pro lk/jk)


@dataclass
class ArboriculturalMeasureItem:
    """Pěstební opatření (řez/vazba)."""
    type: str             # 'výchovný řez' / 'zdravotní řez' / 'bezpečnostní řez' /
                          # 'lokální redukce' / 'obvodová redukce' /
                          # 'instalace bezpečnostní vazby - statické' /
                          # 'instalace bezpečnostní vazby - dynamické'
    count: int = 1                   # počet stromů / vazeb
    height_m: Optional[float] = None
    spread_m: Optional[float] = None
    quarters: Optional[int] = None   # počet čtvrtin koruny (pro lokální redukci)


@dataclass
class CompensationInput:
    """Vstup pro výpočet kompenzačních opatření."""
    base_points: int                          # výchozí hodnota stromu v bodech
    outplantings: list[OutplantingItem] = field(default_factory=list)
    measures: list[ArboriculturalMeasureItem] = field(default_factory=list)
    target_year: int = 2026


@dataclass
class CompensationResultItem:
    description: str
    points: int
    value_in_czk: int
    kind: str = ''  # 'outplanting' | 'measure'


@dataclass
class CompensationResult:
    base_points: int
    correction_frame_pct: float
    correction_frame_min: int
    correction_frame_max: int

    items: list[CompensationResultItem] = field(default_factory=list)
    total_points: int = 0
    inflation_coefficient: float = 1.0
    total_value_in_czk: int = 0

    within_correction_frame: bool = False
    note: Optional[str] = None


# =============================================================================
# Výpočet hodnot výsadeb
# =============================================================================
def outplanting_value_points(item: OutplantingItem) -> int:
    """Vrátí hodnotu výsadby v bodech (cenová úroveň 2020)."""
    base = tables.TAB_15_OUTPLANTING_VALUE[item.group][item.size]
    return base * item.count


# =============================================================================
# Výpočet pěstebních opatření
# =============================================================================
def measure_value_points(m: ArboriculturalMeasureItem) -> int:
    """Vrátí hodnotu pěstebního opatření v bodech (cenová úroveň 2020)."""
    t = m.type

    if t.startswith('výchovný'):
        # Tab. 16: dle výškové kategorie
        if m.height_m is None:
            raise ValueError('výchovný řez vyžaduje výšku stromu')
        if m.height_m >= 9:
            raise ValueError('výchovný řez se aplikuje pouze pro stromy do 9 m')
        for max_h, value in tables.TAB_16_FORMATIVE_CUT:
            if m.height_m <= max_h:
                return value * m.count
        return tables.TAB_16_FORMATIVE_CUT[-1][1] * m.count

    if t.startswith('zdravotní'):
        if m.height_m is None or m.spread_m is None:
            raise ValueError('zdravotní řez vyžaduje výšku a průměr koruny')
        ips = m.height_m * m.spread_m
        return tables.lookup_ips_table(tables.TAB_17_HEALTH_CUT, ips) * m.count

    if t.startswith('bezpečnostní řez'):
        if m.height_m is None or m.spread_m is None:
            raise ValueError('bezpečnostní řez vyžaduje výšku a průměr koruny')
        ips = m.height_m * m.spread_m
        return tables.lookup_ips_table(tables.TAB_18_SAFETY_CUT, ips) * m.count

    if t.startswith('lokální redukce'):
        if m.height_m is None or m.spread_m is None or m.quarters is None:
            raise ValueError('lokální redukce vyžaduje výšku, průměr koruny a počet čtvrtin')
        ips = m.height_m * m.spread_m
        per_quarter = tables.lookup_ips_table(tables.TAB_19_LOCAL_REDUCTION, ips)
        return per_quarter * m.quarters * m.count

    if t.startswith('obvodová'):
        if m.height_m is None or m.spread_m is None:
            raise ValueError('obvodová redukce vyžaduje výšku a průměr koruny')
        ips = m.height_m * m.spread_m
        return tables.lookup_ips_table(tables.TAB_20_PERIMETER_REDUCTION, ips) * m.count

    if 'statické' in t:
        return tables.TAB_21_STATIC_BINDING.get(m.count, tables.TAB_21_STATIC_BINDING[10])

    if 'dynamické' in t:
        return tables.TAB_22_DYNAMIC_BINDING.get(m.count, tables.TAB_22_DYNAMIC_BINDING[10])

    raise ValueError(f'Neznámý typ pěstebního opatření: {t}')


# =============================================================================
# Hlavní funkce
# =============================================================================
def calculate_compensation(inp: CompensationInput) -> CompensationResult:
    """Spočítá hodnoty kompenzačních opatření a kontrolu korekčního rámce."""
    pct = get_correction_frame_pct(inp.base_points)
    cmin, cmax = get_correction_frame_bounds(inp.base_points)

    result = CompensationResult(
        base_points=inp.base_points,
        correction_frame_pct=pct,
        correction_frame_min=cmin,
        correction_frame_max=cmax,
    )

    inflation = tables.get_inflation_coefficient(inp.target_year)
    result.inflation_coefficient = inflation

    # Výsadby
    for op in inp.outplantings:
        pts = outplanting_value_points(op)
        czk = round_to_whole(pts * inflation)
        desc = _format_outplanting_desc(op)
        result.items.append(CompensationResultItem(desc, pts, czk, kind='outplanting'))

    # Pěstební opatření
    for m in inp.measures:
        pts = measure_value_points(m)
        czk = round_to_whole(pts * inflation)
        desc = _format_measure_desc(m)
        result.items.append(CompensationResultItem(desc, pts, czk, kind='measure'))

    result.total_points = sum(it.points for it in result.items)
    result.total_value_in_czk = sum(it.value_in_czk for it in result.items)

    # Kontrola korekčního rámce
    if cmin <= result.total_points <= cmax:
        result.within_correction_frame = True
        result.note = (
            'Celková hodnota kompenzačních opatření leží uvnitř korekčního rámce '
            f'(±{pct:.1f}% základní hodnoty). Nelze přidat další položku.'
        )
    elif result.total_points > cmax:
        result.note = (
            f'Celková hodnota kompenzačních opatření překračuje horní hranici '
            f'korekčního rámce ({cmax} bodů). Poslední přidaná položka je akceptovatelná, '
            'ale další již nelze přidat.'
        )
    else:
        result.note = (
            f'Hodnota leží pod korekčním rámcem ({cmin} bodů). '
            f'Lze přidat další kompenzační opatření.'
        )

    return result


def _format_outplanting_desc(op: OutplantingItem) -> str:
    group_labels = {
        'ls1': 'Listnaté stromy I',
        'ls2': 'Listnaté stromy II',
        'ls3': 'Listnaté stromy III',
        'js1': 'Jehličnaté stromy I',
        'js2': 'Jehličnaté stromy II',
        'lk':  'Listnaté keře',
        'jk':  'Jehličnaté keře',
    }
    label = group_labels.get(op.group, op.group)
    taxon_str = ''
    if op.taxon_latin:
        taxon = find_taxon(op.taxon_latin)
        if taxon:
            taxon_str = f' — {taxon["cz"]} ({taxon["la"]})'
        else:
            taxon_str = f' — {op.taxon_latin}'
    elif op.species:
        taxon_str = f' — {op.species}'
    return f'Výsadba {op.count}× {label} {op.size}{taxon_str}, péče {op.care_length_years} let'


def _format_measure_desc(m: ArboriculturalMeasureItem) -> str:
    parts = [f'{m.count}× {m.type}']
    if m.height_m:
        parts.append(f'výška {m.height_m} m')
    if m.spread_m:
        parts.append(f'průměr koruny {m.spread_m} m')
    if m.quarters:
        parts.append(f'{m.quarters}/4 koruny')
    return ', '.join(parts)


def result_to_dict(result: CompensationResult) -> dict:
    return asdict(result)
