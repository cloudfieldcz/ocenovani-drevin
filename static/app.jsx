/* global React, ReactDOM */
// Hlavní aplikace — kalkulačka oceňování dřevin (varianta "Inspektor").
// Používá window.calculate(input) z api-client.js (preferuje /api/calculate,
// fallback na lokální výpočet z calc.js + data.js).

const inspectorCss = `
.in-root {
  --in-bg: #f1efe9;
  --in-paper: #ffffff;
  --in-ink: #161915;
  --in-muted: #6c6e63;
  --in-faint: #adafa3;
  --in-line: #dedacc;
  --in-line-soft: #eae5d4;
  --in-green: #1f5d31;
  --in-green-bright: #2d6a3e;
  --in-sage: #6e9460;
  --in-amber: #b6862a;
  --in-rust: #a44a2e;
  --in-bark: #5b3e26;
  --in-mono: 'JetBrains Mono', ui-monospace, monospace;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--in-ink);
  background: var(--in-bg);
  min-height: 100vh;
  box-sizing: border-box;
}
.in-root * { box-sizing: border-box; }
.in-root button { font-family: inherit; }

.in-topbar {
  display: flex; align-items: center; padding: 12px 28px;
  background: var(--in-ink); color: #e9e6d8;
  font-size: 12px; letter-spacing: 0.02em;
}
.in-topbar .brand { display: flex; align-items: center; gap: 10px; flex: 1; font-weight: 600; color: white; }
.in-topbar .brand svg { width: 18px; height: 18px; }
.in-topbar .crumb { color: #9c9c8a; }
.in-topbar .actions { display: flex; gap: 18px; }
.in-topbar .actions span { display: flex; gap: 6px; align-items: center; }
.in-topbar b { color: white; font-family: var(--in-mono); font-weight: 500; }

.in-stats {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  background: var(--in-paper); border-bottom: 1px solid var(--in-line);
}
.in-stats > div { padding: 14px 24px; border-right: 1px solid var(--in-line-soft); }
.in-stats > div:last-child { border-right: none; }
.in-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--in-muted); }
.in-stat-value { font-family: var(--in-mono); font-size: 22px; font-weight: 600; margin-top: 4px; color: var(--in-ink); }
.in-stat-value.big { font-size: 30px; color: var(--in-green-bright); letter-spacing: -0.01em; }
.in-stat-sub { font-size: 11px; color: var(--in-muted); margin-top: 2px; }

.in-body { display: grid; grid-template-columns: 720px 1fr; max-width: 1440px; }
.in-form { padding: 20px 28px 60px; border-right: 1px solid var(--in-line); }
.in-rightcol { padding: 20px 28px 60px; }

.in-section { margin-bottom: 20px; }
.in-section-head {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--in-line); margin-bottom: 12px;
}
.in-num {
  font-family: var(--in-mono); font-size: 11px; font-weight: 600;
  padding: 2px 6px; border-radius: 3px; background: var(--in-ink); color: white;
  font-variant-numeric: tabular-nums;
}
.in-section-head h2 {
  margin: 0; font-size: 14px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.in-section-head .hint { font-size: 11px; color: var(--in-muted); margin-left: auto; font-style: italic; }

.in-grid {
  display: grid; grid-template-columns: 180px 1fr; gap: 10px 16px;
  align-items: center;
}
.in-grid > label { font-size: 12px; color: var(--in-muted); padding: 0; font-weight: 500; }
.in-grid .help { grid-column: 2; font-size: 11px; color: var(--in-faint); margin-top: -4px; }

.in-input, .in-select {
  width: 100%; padding: 7px 10px; border: 1px solid var(--in-line);
  border-radius: 4px; background: var(--in-paper); font-size: 13px;
  font-family: inherit; outline: none; transition: border-color 0.1s;
  font-variant-numeric: tabular-nums;
}
.in-input:focus, .in-select:focus { border-color: var(--in-green); box-shadow: 0 0 0 2px rgba(31,93,49,0.15); }
.in-root input[type=number]::-webkit-outer-spin-button,
.in-root input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.in-root input[type=number] { -moz-appearance: textfield; appearance: textfield; }

.in-row { display: flex; gap: 8px; align-items: stretch; }

.in-scale { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; background: var(--in-line-soft); padding: 2px; border-radius: 4px; }
.in-scale-btn {
  background: var(--in-paper); border: none; border-radius: 3px;
  padding: 8px 4px; cursor: pointer; font-size: 11px; font-family: inherit;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  color: var(--in-muted); transition: all 0.1s;
}
.in-scale-btn .num {
  font-family: var(--in-mono); font-weight: 700; font-size: 13px; color: var(--in-ink);
}
.in-scale-btn[aria-pressed="true"] { background: var(--in-green); color: white; }
.in-scale-btn[aria-pressed="true"] .num { color: white; }

.in-pills { display: flex; flex-wrap: wrap; gap: 4px; }
.in-pill {
  padding: 6px 11px; border-radius: 4px; background: var(--in-paper);
  border: 1px solid var(--in-line); cursor: pointer; font-size: 12px;
  color: var(--in-ink); transition: all 0.1s; font-family: inherit;
}
.in-pill:hover { border-color: var(--in-sage); }
.in-pill[aria-pressed="true"] {
  background: var(--in-green); color: white; border-color: var(--in-green);
}

.in-diam-row { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.in-diam {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 4px 4px 8px;
  border: 1px solid var(--in-line); border-radius: 4px; background: var(--in-paper);
  font-size: 13px;
}
.in-diam input {
  width: 50px; border: none; outline: none; background: transparent; font: inherit;
  font-variant-numeric: tabular-nums;
}
.in-diam .x { border: none; background: var(--in-line-soft); width: 18px; height: 18px; border-radius: 3px; cursor: pointer; font-size: 13px; line-height: 1; }
.in-diam .x:hover { background: var(--in-rust); color: white; }
.in-add { border: 1px dashed var(--in-faint); background: transparent; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; color: var(--in-muted); }
.in-add:hover { border-color: var(--in-green); color: var(--in-green); }

.in-check {
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;
  padding: 5px 10px; border: 1px solid var(--in-line); border-radius: 4px; background: var(--in-paper);
}
.in-check[aria-pressed="true"] { background: #f1f7ed; border-color: var(--in-green); }
.in-check input { accent-color: var(--in-green); }

.in-taxon-wrap { position: relative; }
.in-taxon-card {
  margin-top: 6px; padding: 10px 12px; background: var(--in-line-soft);
  border-radius: 4px; display: flex; gap: 10px; align-items: center;
  border-left: 3px solid var(--in-green);
}
.in-cat {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 22px; padding: 0 6px; border-radius: 3px;
  background: var(--in-green); color: white; font-weight: 700; font-size: 12px;
  font-family: var(--in-mono);
}
.in-cat[data-cat="B"] { background: var(--in-amber); }
.in-cat[data-cat="C"] { background: var(--in-rust); }
.in-cat[data-cat^="D"] { background: var(--in-bark); }
.in-taxon-card .meta { font-size: 11px; color: var(--in-muted); }
.in-taxon-card .meta b { color: var(--in-ink); font-weight: 500; }

.in-habitats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
.in-habitat {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border: 1px solid var(--in-line); border-radius: 4px; cursor: pointer;
  background: var(--in-paper); font-size: 12px; transition: all 0.1s;
}
.in-habitat:hover { border-color: var(--in-sage); }
.in-habitat[aria-pressed="true"] { background: #f1f7ed; border-color: var(--in-green); color: var(--in-green); }
.in-habitat .num { font-family: var(--in-mono); font-size: 10px; color: var(--in-faint); }
.in-habitat[aria-pressed="true"] .num { color: var(--in-green); }
.in-habitat .ico { width: 14px; height: 14px; }
.in-habitat .lab { flex: 1; }
.in-habitat .val-flag {
  font-size: 9px; padding: 1px 5px; border-radius: 2px;
  background: #efe6cf; color: var(--in-bark);
  text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;
}
.in-habitat .val-flag.active { background: var(--in-bark); color: white; }

.in-tree-card {
  background: var(--in-paper); border: 1px solid var(--in-line); border-radius: 6px;
  padding: 14px; margin-bottom: 14px; position: relative;
}
.in-tree-card .ti {
  position: absolute; top: 16px; left: 16px; right: 16px;
  display: flex; justify-content: space-between; align-items: flex-start;
  pointer-events: none;
}
.in-tree-card .ti-l h3 { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--in-muted); }
.in-tree-card .ti-l p { margin: 2px 0 0; font-size: 12px; color: var(--in-ink); font-style: italic; }
.in-tree-card .ti-r {
  font-family: var(--in-mono); font-size: 10px; text-align: right; color: var(--in-muted);
  display: flex; flex-direction: column; gap: 2px;
}
.in-tree-card .ti-r b { color: var(--in-ink); font-weight: 500; }

.in-waterfall-card {
  background: var(--in-paper); border: 1px solid var(--in-line); border-radius: 6px;
  padding: 16px 18px 8px; margin-bottom: 14px;
}
.in-waterfall-card h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--in-muted); }
.in-waterfall-card p { margin: 0 0 8px; font-size: 11px; color: var(--in-faint); }

.in-table-card {
  background: var(--in-paper); border: 1px solid var(--in-line); border-radius: 6px;
  overflow: hidden;
}
.in-table-head {
  padding: 10px 16px; background: var(--in-line-soft); display: flex; justify-content: space-between;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--in-muted);
}
.in-table { width: 100%; border-collapse: collapse; }
.in-table td {
  padding: 8px 16px; border-bottom: 1px solid var(--in-line-soft); font-size: 12px;
  vertical-align: middle;
}
.in-table tr:last-child td { border-bottom: none; }
.in-table .tag {
  font-family: var(--in-mono); font-size: 10px; color: var(--in-muted);
  padding: 2px 6px; border-radius: 2px; background: var(--in-line-soft);
  white-space: nowrap;
}
.in-table .val { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; font-family: var(--in-mono); }
.in-table .coef { color: var(--in-muted); font-family: var(--in-mono); font-size: 11px; }
.in-table tr.final td { background: #f1f7ed; font-weight: 600; }
.in-table tr.final .val { color: var(--in-green-bright); font-size: 14px; }

/* Kompenzace */
.in-comp { background: var(--in-paper); border-top: 1px solid var(--in-line); padding: 24px 40px 60px; }
.in-comp-head {
  display: flex; align-items: baseline; gap: 16px; margin-bottom: 16px;
  padding-bottom: 10px; border-bottom: 1px solid var(--in-line);
}
.in-comp-head h2 { margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.in-comp-head .desc { font-size: 12px; color: var(--in-muted); }

.in-comp-frame {
  display: flex; align-items: center; gap: 24px; padding: 12px 16px;
  background: var(--in-line-soft); border-radius: 6px; margin-bottom: 14px;
  border-left: 3px solid var(--in-green);
}
.in-comp-frame > div { display: flex; flex-direction: column; gap: 6px; }
.in-comp-frame .frame-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--in-muted); line-height: 1.1; white-space: nowrap; }
.in-comp-frame .frame-value { font-family: var(--in-mono); font-size: 15px; font-weight: 600; line-height: 1.1; }
.in-comp-frame .frame-sep { color: var(--in-faint); font-size: 18px; align-self: center; }

.in-comp-toolbar { display: flex; gap: 8px; margin-bottom: 14px; }
.in-btn {
  padding: 9px 14px; border-radius: 4px; border: 1px solid var(--in-line);
  background: var(--in-paper); cursor: pointer; font-family: inherit; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.1s;
}
.in-btn:hover { border-color: var(--in-sage); background: #f9f7f0; }
.in-btn.primary { background: var(--in-green); border-color: var(--in-green); color: white; }
.in-btn.primary:hover { background: var(--in-green-bright); }
.in-btn.subtle { color: var(--in-muted); font-size: 12px; padding: 6px 10px; }

.in-comp-form {
  background: #fbfaf3; border: 1px solid var(--in-line); border-radius: 6px;
  padding: 14px 16px; margin-bottom: 14px;
}
.in-comp-form h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--in-muted); }
.in-comp-form-grid { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 10px; align-items: end; }
.in-comp-form-grid .field { display: flex; flex-direction: column; gap: 4px; }
.in-comp-form-grid label { font-size: 11px; color: var(--in-muted); }

.in-comp-empty {
  padding: 28px; text-align: center; color: var(--in-faint); font-size: 13px;
  border: 1px dashed var(--in-line); border-radius: 6px; background: #fbfaf3;
}

.in-comp-table { width: 100%; border-collapse: collapse; background: var(--in-paper); border: 1px solid var(--in-line); border-radius: 6px; overflow: hidden; }
.in-comp-table thead th {
  padding: 10px 14px; background: var(--in-line-soft); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--in-muted);
  text-align: left; font-weight: 600;
}
.in-comp-table thead th.r { text-align: right; }
.in-comp-table td { padding: 10px 14px; border-top: 1px solid var(--in-line-soft); font-size: 13px; vertical-align: middle; }
.in-comp-table td.r { text-align: right; font-family: var(--in-mono); font-variant-numeric: tabular-nums; }
.in-comp-table tr.kind-outplanting td:first-child { border-left: 3px solid var(--in-green); }
.in-comp-table tr.kind-measure td:first-child { border-left: 3px solid var(--in-amber); }
.in-comp-table .kind-tag {
  display: inline-block; font-size: 9px; padding: 2px 5px; border-radius: 3px;
  text-transform: uppercase; letter-spacing: 0.05em; margin-right: 6px; vertical-align: middle;
  font-weight: 700;
}
.in-comp-table .kind-tag.op { background: #e3eedb; color: var(--in-green); }
.in-comp-table .kind-tag.me { background: #f3e3c0; color: var(--in-bark); }
.in-comp-table tr.totals td { background: #f1f7ed; font-weight: 600; border-top: 2px solid var(--in-green); }
.in-comp-table tr.totals td.r { font-size: 15px; color: var(--in-green-bright); }
.in-comp-remove {
  background: transparent; border: none; cursor: pointer; padding: 4px 6px;
  color: var(--in-faint); font-size: 14px; line-height: 1; border-radius: 3px;
}
.in-comp-remove:hover { background: #fde2e2; color: var(--in-rust); }

.in-comp-note {
  margin-top: 12px; padding: 10px 14px; font-size: 12px; border-radius: 4px;
  background: #fff3cd; color: #6b4f0a; border-left: 3px solid var(--in-amber);
}
.in-comp-note.ok { background: #ecf6e6; color: var(--in-green); border-left-color: var(--in-green); }

.in-loading-bar {
  height: 2px; background: var(--in-green); animation: in-pulse 1.2s ease-in-out infinite;
}
@keyframes in-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
`;

// Stálé fyzické fixtury (UI-only, neovlivní výpočet)
const VITALITY_OPTIONS = window.VITALITY_OPTIONS || [];
const HEALTH_OPTIONS = window.HEALTH_OPTIONS || [];
const LOCATION_OPTIONS = window.LOCATION_OPTIONS || [];
const GROWTH_OPTIONS = window.GROWTH_OPTIONS || [];
const CUT_OPTIONS = window.CUT_OPTIONS || [];
const MICRO_HABITATS = window.MICRO_HABITATS || [];

function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  return Math.round(n).toLocaleString('cs-CZ').replace(/,/g, ' ');
}
function fmtCoef(c) { if (c == null) return '—'; return c.toString().replace('.', ','); }

function App() {
  const { useState, useEffect, useMemo, useRef } = React;
  const [taxons, setTaxons] = useState(window.TAXONS || []);
  const [yearInfo, setYearInfo] = useState(window.YEAR_INFO || { target_year: 2026, inflation_coefficient: 1.3543, note: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [state, setState] = useState({
    taxonLa: 'Quercus robur',
    diameters: [50],
    onStump: false,
    treeHeight: 18,
    stemHeight: 5,
    crownSpread: 12,
    crownShape: null,        // null = auto-default z taxonu (viz useEffect níže)
    crownShapeOverride: false, // true = uživatel ručně přepsal, neoverwrituj při změně taxonu
    vitality: 1,
    health: 1,
    cutPct: 0,
    location: 'medium',
    growth: 'unaffected',
    memorial: false,
    habitats: [],
    valuableHabitats: [],
  });
  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  // Načti taxony a info o roce při startu
  useEffect(() => {
    window.loadTaxons().then(setTaxons).catch(console.warn);
    window.loadYearInfo().then(setYearInfo).catch(console.warn);
  }, []);

  // Při změně taxonu auto-vyplň tvar koruny z dat taxonu, nebo 'zaoblena' jako default pro listnáče.
  // Uživatel může v sekci 02 ručně přepsat.
  useEffect(() => {
    if (!taxons || taxons.length === 0) return;
    const t = taxons.find((x) => x.la === state.taxonLa);
    if (!t) return;
    const fromTaxon = t.shape && t.shape !== 'jiny' ? t.shape : 'zaoblena';
    setState((s) => ({ ...s, crownShape: fromTaxon }));
  }, [state.taxonLa, taxons]);

  // Debounced výpočet při změně formuláře
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const r = await window.calculate({
          taxon_latin: state.taxonLa,
          deliberately_planted: false,
          diameters_cm: state.diameters.filter((d) => d > 0),
          dbh_on_stump: state.onStump,
          tree_height_m: state.treeHeight || null,
          stem_height_m: state.stemHeight || null,
          crown_spread_m: state.crownSpread || null,
          crown_shape: state.crownShape || null,
          vitality: state.vitality,
          health: state.health,
          removed_crown_volume_pct: state.cutPct || null,
          location_attractiveness: state.location,
          growth_conditions: state.growth,
          memorial_tree: state.memorial,
          micro_habitats: state.habitats,
          valuable_micro_habitats: state.valuableHabitats,
        });
        setResult(r);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [state]);

  const taxon = useMemo(() => taxons.find((t) => t.la === state.taxonLa), [taxons, state.taxonLa]);

  return (
    <div className="in-root">
      <style>{inspectorCss}</style>

      <div className="in-topbar">
        <span className="brand">
          <svg viewBox="0 0 24 24" fill="white"><path d="M12 2 L17 9 Q19 11 16 12 L19 17 Q21 19 17 19 H13 V22 H11 V19 H7 Q3 19 5 17 L8 12 Q5 11 7 9 Z"/></svg>
          AOPK Oceňování
        </span>
        <span className="crumb">/ záznam stromu / nový výpočet</span>
        <span style={{ flex: 1 }} />
        <span className="actions">
          <span>Rok <b>{yearInfo.target_year}</b></span>
          <span>Inflace <b>{Number(yearInfo.inflation_coefficient).toFixed(4)}</b></span>
          <span>Metodika <b>2022/2021</b></span>
        </span>
      </div>

      {busy && <div className="in-loading-bar" />}
      {error && <div style={{ padding: '12px 28px', background: '#fde2e2', color: '#a44a2e', fontSize: 13 }}>Chyba výpočtu: {error}</div>}

      <div className="in-stats">
        <div>
          <div className="in-stat-label">Hodnota stromu — {result?.target_year || yearInfo.target_year}</div>
          <div className="in-stat-value big">{fmtNum(result?.value_in_czk)} Kč</div>
          <div className="in-stat-sub">{result ? `${fmtNum(result.step_8_final_points)} b. × ${Number(result.inflation_coefficient).toFixed(4)}` : '—'}</div>
        </div>
        <div>
          <div className="in-stat-label">ZBH</div>
          <div className="in-stat-value">{fmtNum(result?.step_1_zbh)}</div>
          <div className="in-stat-sub">krok 1 · základ</div>
        </div>
        <div>
          <div className="in-stat-label">Po koef. zdraví</div>
          <div className="in-stat-value">{fmtNum(result?.step_3_after_health)}</div>
          <div className="in-stat-sub">krok 3 · k = {fmtCoef(result?.health_coefficient)}</div>
        </div>
        <div>
          <div className="in-stat-label">Po koef. polohy</div>
          <div className="in-stat-value">{fmtNum(result?.step_5_after_location)}</div>
          <div className="in-stat-sub">krok 5 · k = {fmtCoef(result?.location_coefficient)}</div>
        </div>
        <div>
          <div className="in-stat-label">Biopotenciál</div>
          <div className="in-stat-value">{result?.bio_points >= 2 ? `+${fmtNum(result.step_6_bio_value)}` : '0'}</div>
          <div className="in-stat-sub">{result?.bio_points || 0} bodů · {result?.bio_points >= 2 ? 'aktivní' : 'pod prahem'}</div>
        </div>
      </div>

      <div className="in-body">
        <div className="in-form">
          <TaxonSection state={state} set={set} taxons={taxons} taxon={taxon} />
          <DimSection state={state} set={set} taxon={taxon} />
          <HealthSection state={state} set={set} />
          <LocSection state={state} set={set} />
          <HabitatsSection state={state} set={set} />
        </div>

        <div className="in-rightcol">
          <div className="in-tree-card">
            <div className="ti">
              <div className="ti-l">
                <h3>Vizualizace</h3>
                <p>{taxon ? `${taxon.cz} (${taxon.la})` : '—'}</p>
              </div>
              <div className="ti-r">
                <span><b>{state.treeHeight}</b> m výška</span>
                <span><b>{state.stemHeight}</b> m nasazení</span>
                <span><b>{state.crownSpread}</b> m koruna</span>
                <span><b>∅ {result?.effective_diameter_cm}</b> cm</span>
              </div>
            </div>
            <TreeViz
              taxon={taxon}
              diameter={result?.effective_diameter_cm || 30}
              treeHeight={state.treeHeight}
              stemHeight={state.stemHeight}
              crownSpread={state.crownSpread}
              vitality={state.vitality}
              health={state.health}
              microHabitats={state.habitats}
              valuableMicroHabitats={state.valuableHabitats}
              memorial={state.memorial}
              width={620}
              canvasHeight={360}
              background="transparent"
            />
          </div>

          <div className="in-waterfall-card">
            <h3>Postup výpočtu</h3>
            <p>9 kroků — každý sloupec ukazuje bodový stav po aplikaci daného koeficientu.</p>
            {result && <Waterfall result={result} width={620} height={220} accent="#1f5d31" subtle="#a1c294" />}
          </div>

          {result && <DetailTable result={result} />}
        </div>
      </div>

      {result && <CompensationSection result={result} state={state} treeState={state} />}
    </div>
  );
}

function TaxonSection({ state, set, taxons, taxon }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const matches = React.useMemo(() => {
    if (!query) return taxons.slice(0, 8);
    const q = query.toLowerCase();
    return taxons.filter((t) => t.cz.toLowerCase().includes(q) || t.la.toLowerCase().includes(q)).slice(0, 8);
  }, [query, taxons]);

  return (
    <div className="in-section">
      <div className="in-section-head">
        <span className="in-num">01</span>
        <h2>Druh</h2>
        <span className="hint">český nebo latinský název</span>
      </div>
      <div className="in-grid">
        <label>Taxon</label>
        <div className="in-taxon-wrap" ref={ref}>
          <input
            className="in-input"
            placeholder={taxon ? `${taxon.cz} — ${taxon.la}` : 'začni psát…'}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {open && matches.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'white', border: '1px solid var(--in-line)', borderRadius: 4, padding: 2, zIndex: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', maxHeight: 240, overflowY: 'auto' }}>
              {matches.map((t) => (
                <button
                  key={t.la}
                  onClick={() => { set({ taxonLa: t.la }); setQuery(''); setOpen(false); }}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '6px 8px', background: t.la === state.taxonLa ? '#f1f7ed' : 'transparent', border: 'none', borderRadius: 3, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12 }}
                >
                  <span className="in-cat" data-cat={t.category} style={{ minWidth: 22, height: 18, fontSize: 10 }}>{t.category}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>{t.cz}</span>
                    <span style={{ color: 'var(--in-muted)', fontStyle: 'italic', marginLeft: 6 }}>{t.la}</span>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--in-faint)', fontFamily: 'var(--in-mono)' }}>{t.shape}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {taxon && (
          <>
            <label>Atributy</label>
            <div className="in-taxon-card">
              <span className="in-cat" data-cat={taxon.category}>{taxon.category}</span>
              <div className="meta">
                <span>tvar <b>{taxon.shape}</b></span> ·{' '}
                <span>regen. <b>{taxon.regenerability || taxon.regen}</b></span> ·{' '}
                <span>bio.význam <b>{taxon.bio_significance || taxon.bio}</b></span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DimSection({ state, set, taxon }) {
  const SHAPE_CHOICES = [
    { value: 'kuzelovita', label: 'kuželovitá' },
    { value: 'sloupovita', label: 'sloupovitá' },
    { value: 'zaoblena',   label: 'zaoblená' },
    { value: 'kulovita',   label: 'kulovitá' },
  ];
  const fromTaxon = taxon?.shape && taxon.shape !== 'jiny' ? taxon.shape : null;
  const updateD = (i, v) => { const arr = [...state.diameters]; arr[i] = parseFloat(v) || 0; set({ diameters: arr }); };
  const addD = () => set({ diameters: [...state.diameters, 30] });
  const removeD = (i) => set({ diameters: state.diameters.filter((_, idx) => idx !== i) });

  return (
    <div className="in-section">
      <div className="in-section-head">
        <span className="in-num">02</span>
        <h2>Rozměry</h2>
        <span className="hint">měřeno ve výčetní výšce 1,3 m</span>
      </div>
      <div className="in-grid">
        <label>Průměry kmenů (cm)</label>
        <div>
          <div className="in-diam-row">
            {state.diameters.map((d, i) => (
              <span className="in-diam" key={i}>
                <input type="number" value={d || ''} onChange={(e) => updateD(i, e.target.value)} step="0.5" min="5" />
                <span style={{ color: 'var(--in-muted)', fontSize: 11 }}>cm</span>
                {state.diameters.length > 1 && <button className="x" onClick={() => removeD(i)}>×</button>}
              </span>
            ))}
            <button className="in-add" onClick={addD}>+ kmen</button>
          </div>
          {state.diameters.length > 1 && <div className="help">Efektivní průměr: <b>{Math.round(Math.sqrt(state.diameters.reduce((s, d) => s + d * d, 0)) * 10) / 10} cm</b></div>}
        </div>

        <label>Pařez</label>
        <label className="in-check" aria-pressed={state.onStump} onClick={() => set({ onStump: !state.onStump })}>
          <input type="checkbox" checked={state.onStump} readOnly /> přepočet d / 1,37
        </label>

        <label>Výška / nasazení / koruna</label>
        <div className="in-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <input type="number" className="in-input" value={state.treeHeight || ''} onChange={(e) => set({ treeHeight: parseFloat(e.target.value) || 0 })} step="0.5" />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--in-muted)', fontSize: 11 }}>m</span>
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <input type="number" className="in-input" value={state.stemHeight || ''} onChange={(e) => set({ stemHeight: parseFloat(e.target.value) || 0 })} step="0.5" />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--in-muted)', fontSize: 11 }}>m</span>
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <input type="number" className="in-input" value={state.crownSpread || ''} onChange={(e) => set({ crownSpread: parseFloat(e.target.value) || 0 })} step="0.5" />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--in-muted)', fontSize: 11 }}>m</span>
          </div>
        </div>
        <div className="help">Všechny tři aktivují přepočet objemu koruny (krok 2).</div>

        <label>Tvar koruny</label>
        <div>
          <div className="in-pills">
            {SHAPE_CHOICES.map((o) => (
              <button
                key={o.value}
                className="in-pill"
                aria-pressed={state.crownShape === o.value}
                onClick={() => set({ crownShape: o.value })}
              >{o.label}</button>
            ))}
          </div>
          <div className="help">
            {fromTaxon
              ? <>Z dat taxonu: <b>{SHAPE_CHOICES.find(c => c.value === fromTaxon)?.label || fromTaxon}</b>. Můžeš přepsat.</>
              : <>Pro tento taxon není tvar v datech — výchozí <b>zaoblená</b>. Vyber přesněji, pokud víš.</>}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthSection({ state, set }) {
  return (
    <div className="in-section">
      <div className="in-section-head">
        <span className="in-num">03</span>
        <h2>Stav</h2>
        <span className="hint">stupně 1 (nejlepší) → 5 (nejhorší)</span>
      </div>
      <div className="in-grid">
        <label>Fyziologická vitalita</label>
        <div className="in-scale">
          {VITALITY_OPTIONS.map((o) => (
            <button key={o.value} className="in-scale-btn" aria-pressed={state.vitality === o.value} onClick={() => set({ vitality: o.value })}>
              <span className="num">{o.value}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
        <label>Zdravotní stav</label>
        <div className="in-scale">
          {HEALTH_OPTIONS.map((o) => (
            <button key={o.value} className="in-scale-btn" aria-pressed={state.health === o.value} onClick={() => set({ health: o.value })}>
              <span className="num">{o.value}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
        <label>Nevhodný řez</label>
        <div className="in-pills">
          {CUT_OPTIONS.map((o) => (
            <button key={o.value} className="in-pill" aria-pressed={state.cutPct === o.value} onClick={() => set({ cutPct: o.value })}>{o.short}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocSection({ state, set }) {
  return (
    <div className="in-section">
      <div className="in-section-head">
        <span className="in-num">04</span>
        <h2>Stanoviště</h2>
      </div>
      <div className="in-grid">
        <label>Atraktivita umístění</label>
        <div className="in-pills">
          {LOCATION_OPTIONS.map((o) => (
            <button key={o.value} className="in-pill" aria-pressed={state.location === o.value} onClick={() => set({ location: o.value })} title={o.desc}>{o.label}</button>
          ))}
        </div>
        <div className="help">{LOCATION_OPTIONS.find(o => o.value === state.location)?.desc}</div>

        <label>Růstové podmínky</label>
        <div className="in-pills">
          {GROWTH_OPTIONS.map((o) => (
            <button key={o.value} className="in-pill" aria-pressed={state.growth === o.value} onClick={() => set({ growth: o.value })}>{o.label}</button>
          ))}
        </div>

        <label>Status</label>
        <label className="in-check" aria-pressed={state.memorial} onClick={() => set({ memorial: !state.memorial })}>
          <input type="checkbox" checked={state.memorial} readOnly /> Památný strom (×2,0)
        </label>
      </div>
    </div>
  );
}

function HabitatsSection({ state, set }) {
  const toggle = (id) => {
    const has = state.habitats.includes(id);
    set({
      habitats: has ? state.habitats.filter((x) => x !== id) : [...state.habitats, id],
      valuableHabitats: has ? state.valuableHabitats.filter((x) => x !== id) : state.valuableHabitats,
    });
  };
  const toggleValuable = (id, e) => {
    e.stopPropagation();
    const has = state.valuableHabitats.includes(id);
    set({ valuableHabitats: has ? state.valuableHabitats.filter((x) => x !== id) : [...state.valuableHabitats, id] });
  };
  const bp = state.habitats.length + state.valuableHabitats.length;

  return (
    <div className="in-section">
      <div className="in-section-head">
        <span className="in-num">05</span>
        <h2>Mikrohabitats</h2>
        <span className="hint">{bp >= 2 ? `${bp} bodů — biopotenciál aktivní` : `${bp} / 2 bodů — pod prahem`}</span>
      </div>
      <div className="in-habitats">
        {MICRO_HABITATS.map((h) => {
          const active = state.habitats.includes(h.id);
          const large = state.valuableHabitats.includes(h.id);
          return (
            <div key={h.id} className="in-habitat" aria-pressed={active} onClick={() => toggle(h.id)}>
              <span className="num">{String(h.id).padStart(2, '0')}</span>
              <span className="ico"><HabitatIcon id={h.icon} /></span>
              <span className="lab">{h.short}</span>
              {h.valuable && active && (
                <span className={`val-flag ${large ? 'active' : ''}`} onClick={(e) => toggleValuable(h.id, e)}>
                  {large ? '✓ rozs.' : '+ rozs.'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabitatIcon({ id }) {
  const props = { width: 14, height: 14, viewBox: '0 0 18 18', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'birdhole': return <svg {...props}><ellipse cx="9" cy="9" rx="3" ry="4" fill="currentColor" opacity="0.85" stroke="none"/></svg>;
    case 'branchhole': return <svg {...props}><circle cx="9" cy="9" r="3" fill="currentColor" opacity="0.7" stroke="none"/></svg>;
    case 'galleries': return <svg {...props}><path d="M3 6 Q6 4 9 6 T15 6 M3 12 Q6 10 9 12 T15 12"/></svg>;
    case 'cavity': return <svg {...props}><ellipse cx="9" cy="9" rx="4" ry="5" fill="currentColor" opacity="0.85" stroke="none"/></svg>;
    case 'peeling': return <svg {...props}><path d="M4 4 Q9 6 5 14 M9 4 Q14 6 11 14"/></svg>;
    case 'stumps': return <svg {...props}><circle cx="6" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M6 9h6"/></svg>;
    case 'fungi': return <svg {...props}><path d="M3 9 Q9 3 15 9 Z" fill="currentColor" opacity="0.8" stroke="none"/><rect x="7" y="9" width="4" height="5"/></svg>;
    case 'damage': return <svg {...props}><path d="M4 4 L8 9 L5 14 L11 11 L14 14 L13 8 L15 4 L9 7 Z" fill="currentColor" opacity="0.5" stroke="none"/></svg>;
    case 'split': return <svg {...props}><path d="M5 3 L9 9 L4 15 M13 3 L9 9 L14 15"/></svg>;
    case 'deadbranch': return <svg {...props}><path d="M3 14 L9 4 L7 8 L11 6 M9 4 L13 9 L12 6"/></svg>;
    case 'cracks': return <svg {...props}><path d="M9 2 L8 6 L10 9 L8 13 L9 16"/></svg>;
    case 'waterpocket': return <svg {...props}><path d="M9 3 Q3 9 9 15 Q15 9 9 3 Z" fill="currentColor" opacity="0.7" stroke="none"/></svg>;
    case 'sap': return <svg {...props}><path d="M6 3 Q6 9 9 12 Q12 9 12 3"/><circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case 'roots': return <svg {...props}><path d="M9 4 V10 M9 10 L5 14 M9 10 L13 14 M9 10 L3 12 M9 10 L15 12"/></svg>;
    default: return <svg {...props}><circle cx="9" cy="9" r="3"/></svg>;
  }
}

function CompensationSection({ result, treeState }) {
  const { useState, useEffect, useRef } = React;
  const [items, setItems] = useState([]);
  const [showOp, setShowOp] = useState(false);
  const [showMe, setShowMe] = useState(false);
  const [comp, setComp] = useState(null);
  const [opForm, setOpForm] = useState({ group: 'ls2', size: '', count: 1 });
  const [meForm, setMeForm] = useState({ type: 'zdravotní řez', height_m: treeState.treeHeight || 12, spread_m: treeState.crownSpread || 8, quarters: 1, count: 1 });
  const [sizes, setSizes] = useState([]);

  // Load sizes whenever group changes
  useEffect(() => {
    window.loadSizes(opForm.group).then((d) => {
      setSizes(d.sizes || []);
      if (d.sizes && d.sizes.length && !d.sizes.find((s) => s.size === opForm.size)) {
        setOpForm((f) => ({ ...f, size: d.sizes[0].size }));
      }
    }).catch(() => {});
  }, [opForm.group]);

  // Recompute compensation whenever items change
  useEffect(() => {
    if (!items.length) { setComp(null); return; }
    window.calculateCompensation({
      base_points: result.value_without_bio_points ?? result.step_5_after_location,
      outplantings: items.filter((i) => i.kind === 'outplanting').map(({ kind, ...rest }) => rest),
      measures: items.filter((i) => i.kind === 'measure').map(({ kind, ...rest }) => rest),
    }).then(setComp).catch((e) => console.warn(e));
  }, [items, result.value_without_bio_points, result.step_5_after_location]);

  const base = result.value_without_bio_points ?? result.step_5_after_location ?? 0;
  let pct = 2; if (base <= 600000) pct = 5; if (base <= 300000) pct = 10;
  const delta = Math.round(base * pct / 100);

  const addOutplanting = () => {
    if (!opForm.size) return;
    setItems((arr) => [...arr, { kind: 'outplanting', group: opForm.group, size: opForm.size, count: opForm.count }]);
    setShowOp(false);
  };
  const addMeasure = () => {
    setItems((arr) => [...arr, { kind: 'measure', ...meForm }]);
    setShowMe(false);
  };
  const removeItem = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const measureDef = window.MEASURE_TYPES.find((m) => m.value === meForm.type);
  const totalP = comp?.total_points || 0;
  const totalKc = comp?.total_value_in_czk || 0;
  const inFrame = totalP >= base - delta && totalP <= base + delta;

  return (
    <div className="in-comp">
      <div className="in-comp-head">
        <span className="in-num">06</span>
        <h2>Kompenzační opatření</h2>
        <span className="desc">Náhradní výsadby a pěstební opatření vyrovnávající ekologickou újmu.</span>
      </div>

      <div className="in-comp-frame">
        <div>
          <div className="frame-label">Výchozí hodnota</div>
          <div className="frame-value">{fmtNum(base)} b.</div>
        </div>
        <div className="frame-sep">·</div>
        <div>
          <div className="frame-label">Korekční rámec ±{pct} %</div>
          <div className="frame-value">{fmtNum(base - delta)} – {fmtNum(base + delta)} b.</div>
        </div>
        <div className="frame-sep">·</div>
        <div>
          <div className="frame-label">Aktuální součet</div>
          <div className="frame-value" style={{ color: totalP ? (inFrame ? 'var(--in-green-bright)' : 'var(--in-amber)') : 'var(--in-faint)' }}>
            {fmtNum(totalP)} b.
          </div>
        </div>
      </div>

      <div className="in-comp-toolbar">
        <button className="in-btn" onClick={() => { setShowOp(!showOp); setShowMe(false); }}>+ Přidat výsadbu</button>
        <button className="in-btn" onClick={() => { setShowMe(!showMe); setShowOp(false); }}>+ Přidat pěstební opatření</button>
      </div>

      {showOp && (
        <div className="in-comp-form">
          <h4>Nová výsadba</h4>
          <div className="in-comp-form-grid">
            <div className="field">
              <label>Skupina taxonu</label>
              <select className="in-select" value={opForm.group} onChange={(e) => setOpForm({ ...opForm, group: e.target.value })}>
                {Object.entries(window.GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Velikost</label>
              <select className="in-select" value={opForm.size} onChange={(e) => setOpForm({ ...opForm, size: e.target.value })}>
                {sizes.map((s) => <option key={s.size} value={s.size}>{s.size} · {fmtNum(s.base_value_points)} b. · péče {s.care_length_years} let</option>)}
              </select>
            </div>
            <div className="field">
              <label>Počet</label>
              <input type="number" min="1" className="in-input" value={opForm.count} onChange={(e) => setOpForm({ ...opForm, count: parseInt(e.target.value) || 1 })} />
            </div>
            <div></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="in-btn primary" onClick={addOutplanting}>Přidat</button>
              <button className="in-btn subtle" onClick={() => setShowOp(false)}>Zrušit</button>
            </div>
          </div>
        </div>
      )}

      {showMe && (
        <div className="in-comp-form">
          <h4>Nové pěstební opatření</h4>
          <div className="in-comp-form-grid">
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Typ</label>
              <select className="in-select" value={meForm.type} onChange={(e) => setMeForm({ ...meForm, type: e.target.value })}>
                {window.MEASURE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {measureDef?.needsHeight && (
              <div className="field">
                <label>Výška stromu (m)</label>
                <input type="number" step="0.5" className="in-input" value={meForm.height_m || ''} onChange={(e) => setMeForm({ ...meForm, height_m: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            {measureDef?.needsSpread && (
              <div className="field">
                <label>Průměr koruny (m)</label>
                <input type="number" step="0.5" className="in-input" value={meForm.spread_m || ''} onChange={(e) => setMeForm({ ...meForm, spread_m: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            {measureDef?.needsQuarters && (
              <div className="field">
                <label>Čtvrtin koruny</label>
                <input type="number" min="1" max="4" className="in-input" value={meForm.quarters || 1} onChange={(e) => setMeForm({ ...meForm, quarters: parseInt(e.target.value) || 1 })} />
              </div>
            )}
            <div className="field">
              <label>Počet</label>
              <input type="number" min="1" className="in-input" value={meForm.count} onChange={(e) => setMeForm({ ...meForm, count: parseInt(e.target.value) || 1 })} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="in-btn primary" onClick={addMeasure}>Přidat</button>
              <button className="in-btn subtle" onClick={() => setShowMe(false)}>Zrušit</button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="in-comp-empty">
          Zatím žádná opatření. Začni přidáním výsadby nebo pěstebního opatření.
        </div>
      ) : (
        <table className="in-comp-table">
          <thead>
            <tr>
              <th>Opatření</th>
              <th className="r">Body</th>
              <th className="r">Hodnota</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {comp?.items?.map((it, idx) => (
              <tr key={idx} className={`kind-${it.kind || items[idx]?.kind}`}>
                <td>
                  <span className={`kind-tag ${(it.kind || items[idx]?.kind) === 'outplanting' ? 'op' : 'me'}`}>
                    {(it.kind || items[idx]?.kind) === 'outplanting' ? 'výsadba' : 'opatření'}
                  </span>
                  {it.description}
                </td>
                <td className="r">{fmtNum(it.points)}</td>
                <td className="r">{fmtNum(it.value_in_czk)} Kč</td>
                <td>
                  <button className="in-comp-remove" onClick={() => removeItem(idx)} title="Odebrat">×</button>
                </td>
              </tr>
            ))}
            <tr className="totals">
              <td>Celkem</td>
              <td className="r">{fmtNum(totalP)} b.</td>
              <td className="r">{fmtNum(totalKc)} Kč</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}

      {comp?.note && (
        <div className={`in-comp-note ${inFrame ? 'ok' : ''}`}>{comp.note}</div>
      )}
    </div>
  );
}

function DetailTable({ result: r }) {
  const rows = [
    { tag: '01', label: 'ZBH', detail: 'Základní bodová hodnota', value: `${fmtNum(r.step_1_zbh)}`, unit: 'b.' },
    { tag: '02', label: 'Koruna', detail: r.crown_ratio != null ? `Objem ${fmtNum(r.real_crown_volume_m3)}/${fmtNum(r.table_crown_volume_m3)} m³ · k=${Number(r.crown_ratio).toFixed(2)}` : 'Tvar koruny neurčen — krok přeskočen', value: `${fmtNum(r.step_2_after_crown)}`, unit: 'b.' },
    { tag: '03', label: 'Zdraví', detail: `Zdraví × vitalita · k=${fmtCoef(r.health_coefficient)}`, value: `${fmtNum(r.step_3_after_health)}`, unit: 'b.' },
    { tag: '04', label: 'Řez', detail: r.cut_coefficient != null ? `Nevhodný řez · k=${fmtCoef(r.cut_coefficient)}` : 'Neaplikováno', value: `${fmtNum(r.step_4_after_cut)}`, unit: 'b.' },
    { tag: '05', label: 'Poloha', detail: `Atrakt. × růst${r.location_coefficient > 1 ? ' × památný' : ''} · k=${fmtCoef(r.location_coefficient)}`, value: `${fmtNum(r.step_5_after_location)}`, unit: 'b.' },
  ];
  if (r.bio_points >= 2) {
    rows.push({ tag: '06', label: 'Biopot.', detail: `${r.bio_points} bodů × ZBH × ${fmtCoef(r.bio_coefficient)}`, value: `+${fmtNum(r.step_6_bio_value)}`, unit: 'b.' });
    rows.push({ tag: '07', label: 'Bio taxon', detail: `Bio význam taxonu · k=${fmtCoef(r.taxon_bio_coefficient)}`, value: `${fmtNum(r.step_7_after_taxon_bio)}`, unit: 'b.' });
  }
  rows.push({ tag: '08', label: 'Σ Body', detail: 'Celková bodová hodnota', value: `${fmtNum(r.step_8_final_points)}`, unit: 'b.', final: true });
  rows.push({ tag: '09', label: 'Kč', detail: `× ${Number(r.inflation_coefficient).toFixed(4)} (inflace ČSÚ → ${r.target_year})`, value: `${fmtNum(r.value_in_czk)}`, unit: 'Kč', final: true });

  return (
    <div className="in-table-card">
      <div className="in-table-head">
        <span>Detailní rozpis výpočtu</span>
        <span>9 kroků · {r.taxon?.la}</span>
      </div>
      <table className="in-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.final ? 'final' : ''}>
              <td style={{ width: 30 }}><span className="tag">{row.tag}</span></td>
              <td style={{ width: 90, fontWeight: 600 }}>{row.label}</td>
              <td className="coef">{row.detail}</td>
              <td className="val">{row.value} <span style={{ color: 'var(--in-muted)', fontWeight: 400 }}>{row.unit}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
