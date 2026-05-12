// Frontend pro kalkulačku oceňování dřevin
// Komunikuje s FastAPI backend přes /api/...

const MICRO_HABITATS = [
    { id: 1, name: 'Dutiny od ptáků, dutinky', valuable: false },
    { id: 2, name: 'Dutiny po větvích', valuable: false },
    { id: 3, name: 'Hmyzí galerie a otvory', valuable: false },
    { id: 4, name: 'Kmenové dutiny', valuable: true },
    { id: 5, name: 'Odlupující/odchylující se borka', valuable: false },
    { id: 6, name: 'Pahýly po větvích', valuable: false },
    { id: 7, name: 'Plodnice hub', valuable: false },
    { id: 8, name: 'Poškození borky', valuable: false },
    { id: 9, name: 'Přítomnost rozštípnutého dřeva', valuable: true },
    { id: 10, name: 'Suché odumřelé větve', valuable: false },
    { id: 11, name: 'Trhliny a nezahojené jizvy', valuable: false },
    { id: 12, name: 'Vodní kapsy', valuable: false },
    { id: 13, name: 'Výtoky mízy a exudátů', valuable: false },
    { id: 14, name: 'Zduřené, členité kořenové náběhy', valuable: false },
];

const VITALITY_LABELS = {
    1: '1 — výborná až mírně snížená',
    2: '2 — zřetelně snížená',
    3: '3 — výrazně snížená',
    4: '4 — zbytková',
    5: '5 — suchý strom',
};

const HEALTH_LABELS = {
    1: '1 — výborný až dobrý',
    2: '2 — zhoršený',
    3: '3 — výrazně zhoršený',
    4: '4 — silně narušený',
    5: '5 — havarijní/rozpadlý strom',
};

let taxons = [];
let currentResult = null;
let compensationItems = [];

// ============================================================================
// Inicializace
// ============================================================================
async function init() {
    await loadTaxons();
    await loadYearInfo();
    setupMicroHabitats();
    setupForm();
    setupCompensation();
}

async function loadTaxons() {
    try {
        const res = await fetch('/api/taxons');
        taxons = await res.json();

        const datalist = document.getElementById('taxon-list');
        taxons.forEach(t => {
            const opt = document.createElement('option');
            opt.value = `${t.cz} — ${t.la}`;
            opt.dataset.la = t.la;
            datalist.appendChild(opt);
        });
    } catch (e) {
        console.error('Selhalo načtení taxonů:', e);
    }
}

async function loadYearInfo() {
    try {
        const res = await fetch('/api/year-info');
        const info = await res.json();
        document.getElementById('info-bar').innerHTML =
            `Výpočet pro rok <strong>${info.target_year}</strong>. ` +
            `Inflační koeficient: <strong>${info.inflation_coefficient.toFixed(4)}</strong>. ` +
            `(${info.note})`;
    } catch (e) {
        console.error(e);
    }
}

function setupMicroHabitats() {
    const container = document.querySelector('.micro-habitats');
    MICRO_HABITATS.forEach(mh => {
        const wrapper = document.createElement('div');

        const label = document.createElement('label');
        label.className = 'checkbox';
        label.innerHTML = `<input type="checkbox" data-mh-id="${mh.id}"> ${mh.id}. ${mh.name}`;
        wrapper.appendChild(label);

        if (mh.valuable) {
            const vlabel = document.createElement('label');
            vlabel.className = 'checkbox valuable';
            vlabel.innerHTML = `<input type="checkbox" data-valuable-mh-id="${mh.id}"> rozsáhlý charakter (= 2 body)`;
            wrapper.appendChild(vlabel);
        }

        container.appendChild(wrapper);
    });
}

function setupForm() {
    document.getElementById('add-diameter').addEventListener('click', () => {
        const div = document.getElementById('diameters');
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.className = 'diameter';
        inp.placeholder = 'cm';
        inp.min = '5';
        inp.step = '0.1';
        div.appendChild(inp);
    });

    document.getElementById('taxon').addEventListener('input', (e) => {
        const value = e.target.value;
        const t = findTaxonByDisplay(value);
        const info = document.getElementById('taxon-info');
        const deliberateRow = document.getElementById('deliberate-row');

        if (t) {
            info.textContent = `Kategorie ${t.category}, regenerovatelnost: ${t.regenerability}, ` +
                `tvar koruny: ${t.shape || '—'}, biologický význam: ${t.bio_significance}`;
            // Pro invazivní (D nebo D/B) zobraz checkbox
            deliberateRow.style.display = t.category.includes('D') ? 'block' : 'none';
        } else {
            info.textContent = '';
            deliberateRow.style.display = 'none';
        }
    });

    document.getElementById('tree-form').addEventListener('submit', onSubmit);
}

function findTaxonByDisplay(displayValue) {
    return taxons.find(t => `${t.cz} — ${t.la}` === displayValue);
}

// ============================================================================
// Výpočet
// ============================================================================
async function onSubmit(e) {
    e.preventDefault();
    hideError();

    const taxonInput = document.getElementById('taxon').value;
    const taxon = findTaxonByDisplay(taxonInput);
    if (!taxon) {
        return showError('Vyber taxon ze seznamu.');
    }

    const diameters = [...document.querySelectorAll('.diameter')]
        .map(i => parseFloat(i.value))
        .filter(v => !isNaN(v) && v > 0);

    if (diameters.length === 0) {
        return showError('Zadej alespoň jeden průměr kmene.');
    }

    const microHabitats = [...document.querySelectorAll('[data-mh-id]:checked')]
        .map(i => parseInt(i.dataset.mhId));
    const valuableMicroHabitats = [...document.querySelectorAll('[data-valuable-mh-id]:checked')]
        .map(i => parseInt(i.dataset.valuableMhId));

    const body = {
        taxon_latin: taxon.la,
        deliberately_planted: document.getElementById('deliberately-planted').checked,
        diameters_cm: diameters,
        dbh_on_stump: document.getElementById('dbh-on-stump').checked,
        tree_height_m: numOrNull('tree-height'),
        stem_height_m: numOrNull('stem-height'),
        crown_spread_m: numOrNull('crown-spread'),
        vitality: parseInt(document.getElementById('vitality').value),
        health: parseInt(document.getElementById('health').value),
        removed_crown_volume_pct: numOrNull('removed-crown-volume'),
        location_attractiveness: document.getElementById('location-attractiveness').value,
        growth_conditions: document.getElementById('growth-conditions').value,
        memorial_tree: document.getElementById('memorial-tree').checked,
        micro_habitats: microHabitats,
        valuable_micro_habitats: valuableMicroHabitats,
    };

    try {
        const res = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Chyba výpočtu');
        }

        const result = await res.json();
        currentResult = result;
        renderResult(result);
    } catch (e) {
        showError(e.message);
    }
}

function numOrNull(id) {
    const v = document.getElementById(id).value;
    return v === '' ? null : parseFloat(v);
}

function fmt(n) {
    if (n === null || n === undefined) return '—';
    return Math.round(n).toLocaleString('cs-CZ');
}

function fmtCoef(c) {
    if (c === null || c === undefined) return '—';
    return c.toString().replace('.', ',');
}

// ============================================================================
// Zobrazení výsledku
// ============================================================================
function renderResult(r) {
    const section = document.getElementById('result-section');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });

    const rows = [];

    rows.push(rowSection('Vstupní parametry'));
    rows.push(row('Taxon', `${r.taxon.cz} (${r.taxon.la})`));
    rows.push(row('Kategorie taxonu', r.category));
    rows.push(row('Výpočtový průměr kmene', `${r.effective_diameter_cm} cm`));
    if (r.crown_shape) rows.push(row('Tvar koruny', r.crown_shape));

    rows.push(rowSection('Výpočet'));
    rows.push(row('Krok 1 — Základní hodnota (ZBH)', `${fmt(r.step_1_zbh)} bodů`));

    if (r.real_crown_volume_m3 !== null) {
        rows.push(row(
            `Krok 2 — Zohlednění objemu koruny (${fmt(r.real_crown_volume_m3)} / ${fmt(r.table_crown_volume_m3)} m³)`,
            `${fmt(r.step_2_after_crown)} bodů`
        ));
    } else {
        rows.push(row('Krok 2 — Zohlednění objemu koruny (vynecháno)', `${fmt(r.step_2_after_crown)} bodů`));
    }

    rows.push(row(
        `Krok 3 — Zdravotní stav × vitalita (koef ${fmtCoef(r.health_coefficient)})`,
        `${fmt(r.step_3_after_health)} bodů`
    ));

    if (r.cut_coefficient !== null) {
        rows.push(row(
            `Krok 4 — Nevhodný řez (koef ${fmtCoef(r.cut_coefficient)})`,
            `−${fmt(r.cut_reduction)} = ${fmt(r.step_4_after_cut)} bodů`
        ));
    } else {
        rows.push(row('Krok 4 — Nevhodný řez (neaplikováno)', `${fmt(r.step_4_after_cut)} bodů`));
    }

    rows.push(row(
        `Krok 5 — Polohový koeficient (${fmtCoef(r.location_coefficient)})`,
        `${fmt(r.step_5_after_location)} bodů`
    ));

    if (r.bio_points >= 2) {
        rows.push(row(
            `Krok 6 — Biopotenciál (${r.bio_points} bodů × ZBH × ${fmtCoef(r.bio_coefficient)})`,
            `${fmt(r.step_6_bio_value)} bodů`
        ));
        rows.push(row(
            `Krok 7 — Biologický význam taxonu (koef ${fmtCoef(r.taxon_bio_coefficient)})`,
            `${fmt(r.step_7_after_taxon_bio)} bodů`
        ));
    } else {
        rows.push(row('Krok 6-7 — Biopotenciál (vynecháno, méně než 2 body)', '—'));
    }

    rows.push(rowFinal(
        `Krok 8 — Celková bodová hodnota`,
        `${fmt(r.step_8_final_points)} bodů`
    ));

    rows.push(row(
        `Krok 9 — Hodnota v Kč pro rok ${r.target_year} (inflační koef ${r.inflation_coefficient})`,
        `${fmt(r.value_in_czk)} Kč`
    ));

    document.getElementById('result-rows').innerHTML = rows.join('');

    document.getElementById('result-summary').innerHTML =
        `Hodnota stromu v roce ${r.target_year}: <strong>${fmt(r.value_in_czk)} Kč</strong>`;

    if (r.damage_in_czk) {
        document.getElementById('damage-info').style.display = 'block';
        document.getElementById('damage-info').innerHTML =
            `<strong>Výše vzniklé újmy:</strong> ${fmt(r.damage_in_czk)} Kč ` +
            `(hodnota stromu bez nevhodného řezu by byla ${fmt(r.value_in_czk_without_cut)} Kč).`;
    } else {
        document.getElementById('damage-info').style.display = 'none';
    }

    // Zobraz kompenzační sekci
    document.getElementById('compensation-block').style.display = 'block';
    renderCompensationFrame(r);
    compensationItems = [];
    renderCompensationList();
}

function row(label, value) {
    return `<tr><td class="step-name">${label}</td><td class="step-value">${value}</td></tr>`;
}

function rowFinal(label, value) {
    return `<tr class="final"><td class="step-name">${label}</td><td class="step-value">${value}</td></tr>`;
}

function rowSection(label) {
    return `<tr><th colspan="2">${label}</th></tr>`;
}

// ============================================================================
// Kompenzace
// ============================================================================
function renderCompensationFrame(r) {
    // Použij hodnotu bez biopotenciálu jako výchozí (typický postup metodiky)
    const base = r.value_without_bio_points;
    let pct;
    if (base <= 300_000) pct = 10;
    else if (base <= 600_000) pct = 5;
    else pct = 2;
    const delta = Math.round(base * pct / 100);
    document.getElementById('compensation-frame-info').innerHTML =
        `Výchozí hodnota: <strong>${fmt(base)} bodů</strong>. ` +
        `Korekční rámec: <strong>±${pct} %</strong> ` +
        `(${fmt(base - delta)} – ${fmt(base + delta)} bodů).`;
}

function setupCompensation() {
    // Načti velikosti při změně skupiny
    const groupSelect = document.getElementById('op-group');
    groupSelect.addEventListener('change', updateSizesForGroup);

    document.getElementById('btn-add-outplanting').addEventListener('click', () => {
        document.getElementById('outplanting-form').style.display = 'block';
        document.getElementById('measure-form').style.display = 'none';
        updateSizesForGroup();
    });
    document.getElementById('btn-add-measure').addEventListener('click', () => {
        document.getElementById('measure-form').style.display = 'block';
        document.getElementById('outplanting-form').style.display = 'none';
        updateMeasureFormFields();
    });

    document.getElementById('btn-cancel-outplanting').addEventListener('click', () => {
        document.getElementById('outplanting-form').style.display = 'none';
    });
    document.getElementById('btn-cancel-measure').addEventListener('click', () => {
        document.getElementById('measure-form').style.display = 'none';
    });

    document.getElementById('btn-confirm-outplanting').addEventListener('click', addOutplanting);
    document.getElementById('btn-confirm-measure').addEventListener('click', addMeasure);

    document.getElementById('m-type').addEventListener('change', updateMeasureFormFields);
}

async function updateSizesForGroup() {
    const group = document.getElementById('op-group').value;
    const res = await fetch(`/api/sizes/${group}`);
    const data = await res.json();
    const sizeSelect = document.getElementById('op-size');
    sizeSelect.innerHTML = '';
    data.sizes.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.size;
        opt.textContent = `${s.size} (péče ${s.care_length_years} let, ${fmt(s.base_value_points)} bodů)`;
        sizeSelect.appendChild(opt);
    });
}

function updateMeasureFormFields() {
    const type = document.getElementById('m-type').value;
    const showHeight = ['výchovný řez', 'zdravotní řez', 'bezpečnostní řez',
                        'lokální redukce', 'obvodová redukce'].includes(type);
    const showSpread = ['zdravotní řez', 'bezpečnostní řez',
                        'lokální redukce', 'obvodová redukce'].includes(type);
    const showQuarters = type === 'lokální redukce';

    document.getElementById('m-height-row').style.display = showHeight ? 'block' : 'none';
    document.getElementById('m-spread-row').style.display = showSpread ? 'block' : 'none';
    document.getElementById('m-quarters-row').style.display = showQuarters ? 'block' : 'none';
}

function addOutplanting() {
    const op = {
        group: document.getElementById('op-group').value,
        size: document.getElementById('op-size').value,
        count: parseInt(document.getElementById('op-count').value),
    };
    if (!op.size || !op.count) return showError('Vyber velikost a počet.');
    compensationItems.push({ kind: 'outplanting', ...op });
    document.getElementById('outplanting-form').style.display = 'none';
    refreshCompensation();
}

function addMeasure() {
    const m = {
        type: document.getElementById('m-type').value,
        count: parseInt(document.getElementById('m-count').value),
        height_m: numOrNull('m-height'),
        spread_m: numOrNull('m-spread'),
        quarters: numOrNull('m-quarters'),
    };
    compensationItems.push({ kind: 'measure', ...m });
    document.getElementById('measure-form').style.display = 'none';
    refreshCompensation();
}

async function refreshCompensation() {
    if (!currentResult) return;
    const body = {
        base_points: currentResult.value_without_bio_points,
        outplantings: compensationItems.filter(i => i.kind === 'outplanting').map(i => ({
            group: i.group, size: i.size, count: i.count,
        })),
        measures: compensationItems.filter(i => i.kind === 'measure').map(i => ({
            type: i.type, count: i.count,
            height_m: i.height_m, spread_m: i.spread_m, quarters: i.quarters,
        })),
    };

    try {
        const res = await fetch('/api/compensation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Chyba');
        }
        const data = await res.json();
        renderCompensation(data);
    } catch (e) {
        showError(e.message);
    }
}

function renderCompensationList() {
    document.getElementById('compensation-rows').innerHTML = '';
    document.getElementById('compensation-total').textContent = '';
    document.getElementById('compensation-note').textContent = '';
}

function renderCompensation(data) {
    const rows = data.items.map((item, idx) => `
        <tr>
            <td>${item.description}</td>
            <td class="right">${fmt(item.points)}</td>
            <td class="right">${fmt(item.value_in_czk)}</td>
        </tr>
    `).join('');
    document.getElementById('compensation-rows').innerHTML = rows;
    document.getElementById('compensation-total').innerHTML =
        `Celkem: <strong>${fmt(data.total_points)} bodů</strong> = ` +
        `<strong>${fmt(data.total_value_in_czk)} Kč</strong>`;
    document.getElementById('compensation-note').textContent = data.note || '';
}

// ============================================================================
// Chyby
// ============================================================================
function showError(msg) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = msg;
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

// ============================================================================
init();
