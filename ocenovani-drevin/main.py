"""
FastAPI server pro kalkulačku oceňování dřevin dle metodiky AOPK ČR.

Endpointy:
    GET  /              — statický HTML formulář
    GET  /api/taxons    — seznam taxonů
    POST /api/calculate — výpočet hodnoty stromu
    POST /api/group     — výpočet hodnoty porostu
    POST /api/compensation — výpočet kompenzačních opatření
    GET  /api/year-info — informace o roce a inflačním koeficientu

Spuštění:
    uv run uvicorn main:app --reload
    nebo: python -m uvicorn main:app --reload
"""
from __future__ import annotations
from datetime import datetime
from pathlib import Path
from typing import Optional, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from calculator import (
    TreeInput, calculate_tree, result_to_dict,
    GroupInput, calculate_group,
)
from compensation import (
    CompensationInput, OutplantingItem, ArboriculturalMeasureItem,
    calculate_compensation, result_to_dict as compensation_to_dict,
    SIZE_CATEGORIES, get_default_care_length_years,
)
from data import tables
from data.taxons import TAXONS


app = FastAPI(
    title='Oceňování dřevin',
    description='Kalkulátor hodnoty dřevin dle metodiky AOPK ČR (verze 2021/2022)',
    version='0.1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


# =============================================================================
# Pydantic schémata
# =============================================================================
class TreeCalculateRequest(BaseModel):
    """Vstup pro výpočet hodnoty solitérního stromu."""
    taxon_latin: str = Field(..., description='Latinský název taxonu')
    deliberately_planted: bool = Field(False, description='Záměrně vysazený invazivní taxon (přeřazení D→B)')

    diameters_cm: list[float] = Field(..., description='Průměry kmenů v cm')
    dbh_on_stump: bool = Field(False, description='Měřeno na pařezu')

    tree_height_m: Optional[float] = Field(None, description='Výška stromu (m)')
    stem_height_m: Optional[float] = Field(None, description='Výška nasazení koruny (m)')
    crown_spread_m: Optional[float] = Field(None, description='Průměr koruny (m)')

    vitality: int = Field(1, ge=1, le=5, description='Fyziologická vitalita 1-5')
    health: int = Field(1, ge=1, le=5, description='Zdravotní stav 1-5')

    removed_crown_volume_pct: Optional[int] = Field(
        None, description='Odstraněná část koruny v % (10, 20, ..., 90)'
    )

    location_attractiveness: Literal['high', 'medium', 'less_significant', 'low', 'very_low'] = 'medium'
    growth_conditions: Literal['unaffected', 'good', 'impaired', 'extreme'] = 'unaffected'

    memorial_tree: bool = False

    micro_habitats: list[int] = Field(default_factory=list, description='IDs mikrohabitatů (1-14)')
    valuable_micro_habitats: list[int] = Field(default_factory=list, description='IDs s rozsáhlým charakterem (jen 4 a 9)')

    target_year: Optional[int] = Field(None, description='Rok pro výpočet hodnoty (default = aktuální rok)')


class GroupCalculateRequest(BaseModel):
    character: Literal[
        'kere_nizke', 'kere_vysoke', 'liany',
        'porost_stromu_mlady', 'porost_stromu_stredni',
        'porost_stromu_dospely', 'porost_stromu_diferencovany',
    ]
    area_m2: float = Field(..., gt=0)
    suitability: Literal['invazni', 'nezadouci', 'ostatni', 'vhodne_skladby']
    cultivation: Literal['zanedbany', 'nevychovavany', 'vychovavany']
    bio_value: Literal['nizka', 'stredni', 'vysoka']
    location_attractiveness: Literal['mene_vyznamna', 'stredni', 'vysoka']
    target_year: Optional[int] = None


class OutplantingRequest(BaseModel):
    group: Literal['ls1', 'ls2', 'ls3', 'js1', 'js2', 'lk', 'jk']
    size: str
    count: int = Field(..., ge=1)
    care_length_years: Optional[int] = None
    taxon_latin: Optional[str] = None
    species: Optional[str] = None


class MeasureRequest(BaseModel):
    type: str
    count: int = Field(..., ge=1)
    height_m: Optional[float] = None
    spread_m: Optional[float] = None
    quarters: Optional[int] = None


class CompensationRequest(BaseModel):
    base_points: int = Field(..., ge=0, description='Hodnota stromu v bodech (z výpočtu stromu)')
    outplantings: list[OutplantingRequest] = Field(default_factory=list)
    measures: list[MeasureRequest] = Field(default_factory=list)
    target_year: Optional[int] = None


# =============================================================================
# Endpointy
# =============================================================================
@app.get('/api/taxons', summary='Seznam taxonů s kategoriemi')
async def list_taxons():
    """Vrátí seřazený seznam taxonů s metadaty pro výběr ve formuláři."""
    return [
        {
            'cz': t['cz'],
            'la': t['la'],
            'category': t['category'],
            'regenerability': t['regenerability'],
            'shape': t['shape'],
            'bio_significance': t['bio_significance'],
        }
        for t in TAXONS
    ]


@app.get('/api/year-info', summary='Informace o roce a inflačním koeficientu')
async def year_info(target_year: Optional[int] = None):
    """Vrátí inflační koeficient pro daný rok (default aktuální rok)."""
    if target_year is None:
        target_year = datetime.now().year
    coef = tables.get_inflation_coefficient(target_year)
    return {
        'target_year': target_year,
        'inflation_coefficient': coef,
        'note': (
            f'Hodnoty v metodice jsou v cenové úrovni 2020. Pro rok {target_year} '
            f'se aplikuje inflační koeficient {coef:.4f}.'
        ),
    }


@app.post('/api/calculate', summary='Výpočet hodnoty solitérního stromu')
async def calculate(req: TreeCalculateRequest):
    """Provede 9-krokový výpočet hodnoty stromu dle metodiky."""
    target_year = req.target_year or datetime.now().year
    inp = TreeInput(
        taxon_latin=req.taxon_latin,
        deliberately_planted=req.deliberately_planted,
        diameters_cm=req.diameters_cm,
        dbh_on_stump=req.dbh_on_stump,
        tree_height_m=req.tree_height_m,
        stem_height_m=req.stem_height_m,
        crown_spread_m=req.crown_spread_m,
        vitality=req.vitality,
        health=req.health,
        removed_crown_volume_pct=req.removed_crown_volume_pct,
        location_attractiveness=req.location_attractiveness,
        growth_conditions=req.growth_conditions,
        memorial_tree=req.memorial_tree,
        micro_habitats=req.micro_habitats,
        valuable_micro_habitats=req.valuable_micro_habitats,
        target_year=target_year,
    )
    try:
        result = calculate_tree(inp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result_to_dict(result)


@app.post('/api/group', summary='Výpočet hodnoty porostu dřevin')
async def calculate_group_endpoint(req: GroupCalculateRequest):
    target_year = req.target_year or datetime.now().year
    inp = GroupInput(
        character=req.character,
        area_m2=req.area_m2,
        suitability=req.suitability,
        cultivation=req.cultivation,
        bio_value=req.bio_value,
        location_attractiveness=req.location_attractiveness,
        target_year=target_year,
    )
    try:
        result = calculate_group(inp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        'step_1_base': result.step_1_base,
        'step_2_after_quality': result.step_2_after_quality,
        'step_3_after_location': result.step_3_after_location,
        'quality_coefficient': result.quality_coefficient,
        'location_coefficient': result.location_coefficient,
        'inflation_coefficient': result.inflation_coefficient,
        'value_in_czk': result.value_in_czk,
    }


@app.post('/api/compensation', summary='Výpočet kompenzačních opatření')
async def calculate_compensation_endpoint(req: CompensationRequest):
    target_year = req.target_year or datetime.now().year
    outplantings = [
        OutplantingItem(
            group=op.group,
            size=op.size,
            count=op.count,
            care_length_years=op.care_length_years or get_default_care_length_years(op.size),
            taxon_latin=op.taxon_latin,
            species=op.species,
        )
        for op in req.outplantings
    ]
    measures = [
        ArboriculturalMeasureItem(
            type=m.type,
            count=m.count,
            height_m=m.height_m,
            spread_m=m.spread_m,
            quarters=m.quarters,
        )
        for m in req.measures
    ]
    inp = CompensationInput(
        base_points=req.base_points,
        outplantings=outplantings,
        measures=measures,
        target_year=target_year,
    )
    try:
        result = calculate_compensation(inp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return compensation_to_dict(result)


@app.get('/api/sizes/{group}', summary='Velikostní kategorie pro skupinu výsadby')
async def list_sizes(group: str):
    """Vrátí velikostní kategorie pro danou skupinu (ls1, ls2, ..., jk)."""
    if group not in SIZE_CATEGORIES:
        raise HTTPException(status_code=404, detail=f'Neznámá skupina: {group}')
    return {
        'group': group,
        'sizes': [
            {
                'size': s,
                'care_length_years': get_default_care_length_years(s),
                'base_value_points': tables.TAB_15_OUTPLANTING_VALUE[group][s],
            }
            for s in SIZE_CATEGORIES[group]
        ],
    }


# =============================================================================
# Statické soubory
# =============================================================================
STATIC_DIR = Path(__file__).parent / 'static'

if STATIC_DIR.exists():
    app.mount('/static', StaticFiles(directory=STATIC_DIR), name='static')


@app.get('/')
async def index():
    """Hlavní stránka - formulář pro výpočet."""
    return FileResponse(STATIC_DIR / 'index.html')


def run():
    """Entry point pro `uv run ocenovani-drevin` nebo `python main.py`."""
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000, reload=False)


if __name__ == '__main__':
    run()
