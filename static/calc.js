// Zjednodušená lokální kalkulačka, která sleduje strukturu 9-kroků z metodiky AOPK.
// Pro plné napojení nahraď fn `calculateTree` voláním /api/calculate.

(function () {
  // Koeficienty pro vitalita × zdravotní stav (5x5) — orientační
  const HEALTH_VITALITY = [
    // health: 1    2     3     4     5
    [1.00, 0.85, 0.65, 0.40, 0.10], // vitality 1
    [0.85, 0.70, 0.50, 0.30, 0.10], // vitality 2
    [0.65, 0.50, 0.35, 0.20, 0.05], // vitality 3
    [0.40, 0.30, 0.20, 0.10, 0.05], // vitality 4
    [0.10, 0.10, 0.05, 0.05, 0.00], // vitality 5
  ];

  const CATEGORY_K = { 'A': 112, 'B': 78, 'C': 50, 'D': 18, 'D/B': 78 };
  const BIO_TAXON_COEF = { 'vysoký': 1.30, 'střední': 1.15, 'nízký': 1.0 };

  function effectiveDiameter(diameters, onStump) {
    if (!diameters || diameters.length === 0) return 0;
    // Pro vícekmen: d_eff = sqrt(d1² + d2² + ...) (kvadratická střední)
    const valid = diameters.filter(d => d > 0);
    if (valid.length === 0) return 0;
    const sumSq = valid.reduce((s, d) => s + d * d, 0);
    let d = Math.sqrt(sumSq);
    if (onStump) d = d / 1.37;
    return Math.round(d * 10) / 10;
  }

  function lookupZBH(category, diameter) {
    // Aproximace: ZBH ≈ k * d²  (orientačně). Plná metodika má diskrétní tabulky.
    const k = CATEGORY_K[category] ?? CATEGORY_K['A'];
    return Math.max(0, Math.round(k * diameter * diameter));
  }

  function crownVolumeM3(height, stemHeight, spread) {
    if (!height || !stemHeight || !spread) return null;
    const crownH = Math.max(0, height - stemHeight);
    const r = spread / 2;
    // Aproximace jako elipsoid: V = 4/3 π r² (crownH/2)
    const v = (4 / 3) * Math.PI * r * r * (crownH / 2);
    return Math.max(0, v);
  }

  function tableCrownVolumeM3(shape, diameter) {
    // Orientační tabulkový objem podle průměru kmene (cm) a tvaru.
    const d = diameter / 100; // m
    const base = Math.pow(diameter, 1.5) * 0.5; // empirická aproximace
    const factor = { 'kuželovitá': 0.85, 'vejčitá': 1.0, 'kulová': 1.1, 'sloupovitá': 0.65 }[shape] ?? 1.0;
    return base * factor;
  }

  function locationCoef(attr, growth, memorial) {
    const loc = window.LOCATION_OPTIONS.find(o => o.value === attr)?.coef ?? 0.5;
    const grw = window.GROWTH_OPTIONS.find(o => o.value === growth)?.coef ?? 1.0;
    let coef = loc * grw;
    if (memorial) coef *= 2.0;
    return Math.round(coef * 1000) / 1000;
  }

  function cutCoef(pct) {
    if (pct == null || pct === 0) return null;
    const opt = window.CUT_OPTIONS.find(o => o.value === pct);
    return opt ? opt.coef : null;
  }

  function bioPoints(habitats, valuable) {
    let p = (habitats || []).length;
    p += (valuable || []).length; // valuable counts as +1 extra (so total 2)
    return p;
  }

  window.calculateTree = function calculateTree(input) {
    const taxon = window.TAXONS.find(t => t.la === input.taxon_latin);
    if (!taxon) return null;

    const effD = effectiveDiameter(input.diameters_cm, input.dbh_on_stump);
    if (effD < 5) return null;

    const zbh = lookupZBH(taxon.category, effD);

    // Krok 2 - objem koruny
    const realCV = crownVolumeM3(input.tree_height_m, input.stem_height_m, input.crown_spread_m);
    const tableCV = tableCrownVolumeM3(taxon.shape, effD);
    let afterCrown = zbh;
    let crownRatio = null;
    if (realCV !== null && tableCV > 0) {
      crownRatio = Math.min(1.0, realCV / tableCV);
      afterCrown = Math.round(zbh * crownRatio);
    }

    // Krok 3 - vitalita × zdravotní stav
    const v = (input.vitality || 1) - 1;
    const h = (input.health || 1) - 1;
    const healthCoef = HEALTH_VITALITY[v]?.[h] ?? 1.0;
    const afterHealth = Math.round(afterCrown * healthCoef);

    // Krok 4 - nevhodný řez
    const cutC = cutCoef(input.removed_crown_volume_pct);
    let afterCut = afterHealth;
    let cutReduction = 0;
    if (cutC !== null) {
      afterCut = Math.round(afterHealth * cutC);
      cutReduction = afterHealth - afterCut;
    }

    // Krok 5 - polohový koeficient (× růst × památný)
    const locCoef = locationCoef(input.location_attractiveness, input.growth_conditions, input.memorial_tree);
    const afterLoc = Math.round(afterCut * locCoef);

    // Krok 6-7 - biopotenciál
    const bp = bioPoints(input.micro_habitats, input.valuable_micro_habitats);
    const taxonBioCoef = BIO_TAXON_COEF[taxon.bio] ?? 1.0;
    const bioCoef = 0.06; // ZBH × bp × 0.06 ≈ orientační bio hodnota
    let bioValue = 0;
    let afterTaxonBio = afterLoc;
    if (bp >= 2) {
      bioValue = Math.round(zbh * bp * bioCoef);
      afterTaxonBio = Math.round((afterLoc + bioValue) * taxonBioCoef);
    }

    const finalPoints = afterTaxonBio;
    const valueCzk = Math.round(finalPoints * window.YEAR_INFO.inflation_coefficient);
    const valueWithoutCut = Math.round(afterHealth * locCoef * (bp >= 2 ? taxonBioCoef : 1) * window.YEAR_INFO.inflation_coefficient);
    const damage = cutC !== null ? Math.max(0, valueWithoutCut - valueCzk) : 0;

    return {
      taxon,
      effective_diameter_cm: effD,
      crown_shape: taxon.shape,
      step_1_zbh: zbh,
      real_crown_volume_m3: realCV,
      table_crown_volume_m3: tableCV,
      step_2_after_crown: afterCrown,
      crown_ratio: crownRatio,
      health_coefficient: healthCoef,
      step_3_after_health: afterHealth,
      cut_coefficient: cutC,
      cut_reduction: cutReduction,
      step_4_after_cut: afterCut,
      location_coefficient: locCoef,
      step_5_after_location: afterLoc,
      bio_points: bp,
      bio_coefficient: bioCoef,
      step_6_bio_value: bioValue,
      taxon_bio_coefficient: taxonBioCoef,
      step_7_after_taxon_bio: afterTaxonBio,
      step_8_final_points: finalPoints,
      target_year: window.YEAR_INFO.target_year,
      inflation_coefficient: window.YEAR_INFO.inflation_coefficient,
      value_in_czk: valueCzk,
      value_in_czk_without_cut: valueWithoutCut,
      damage_in_czk: damage,
      value_without_bio_points: afterLoc,
    };
  };

  window.fmtNum = function (n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toLocaleString('cs-CZ').replace(/,/g, ' ');
  };
  window.fmtCoef = function (c) {
    if (c == null) return '—';
    return c.toString().replace('.', ',');
  };

  // ============================================================
  // Kompenzační opatření — MOCK (jen offline fallback).
  // Vstup: { base_points, outplantings: [...], measures: [...] }
  // ============================================================
  window.calculateCompensationLocal = function (input) {
    const inflation = window.YEAR_INFO.inflation_coefficient;
    const items = [];

    (input.outplantings || []).forEach((op) => {
      const groupSizes = window.SIZES_BY_GROUP[op.group] || [];
      const sz = groupSizes.find((s) => s.size === op.size);
      if (!sz) return;
      const count = op.count || 1;
      const points = sz.base_value_points * count;
      items.push({
        kind: 'outplanting',
        description: `${count}× výsadba ${window.GROUP_LABELS[op.group] || op.group} · velikost ${op.size} (péče ${sz.care_length_years} let)`,
        points,
        value_in_czk: Math.round(points * inflation),
      });
    });

    (input.measures || []).forEach((m) => {
      const def = window.MEASURE_TYPES.find((mt) => mt.value === m.type);
      if (!def) return;
      const count = m.count || 1;
      let points = 0;
      if (def.flat) {
        points = def.flat * count;
      } else if (def.basePerM) {
        points = (m.height_m || 0) * def.basePerM * count;
      } else if (def.basePerM2) {
        const area = (m.height_m || 0) * (m.spread_m || 0);
        let mult = 1;
        if (def.needsQuarters) mult = (m.quarters || 1) / 4;
        points = area * def.basePerM2 * mult * count;
      }
      points = Math.round(points);
      let descBits = [`${count}× ${def.label}`];
      if (m.height_m) descBits.push(`v ${m.height_m} m`);
      if (m.spread_m) descBits.push(`koruna ${m.spread_m} m`);
      if (def.needsQuarters && m.quarters) descBits.push(`${m.quarters}/4 koruny`);
      items.push({
        kind: 'measure',
        description: descBits.join(' · '),
        points,
        value_in_czk: Math.round(points * inflation),
      });
    });

    const total_points = items.reduce((s, i) => s + i.points, 0);
    const base = input.base_points || 0;
    let pct = 2; if (base <= 600000) pct = 5; if (base <= 300000) pct = 10;
    const delta = Math.round(base * pct / 100);
    const lo = base - delta, hi = base + delta;
    let note = '';
    if (total_points && (total_points < lo || total_points > hi)) {
      note = `Pozor: součet ${total_points.toLocaleString('cs-CZ').replace(/,/g, ' ')} b. je mimo korekční rámec ±${pct} % (${lo.toLocaleString('cs-CZ').replace(/,/g, ' ')}–${hi.toLocaleString('cs-CZ').replace(/,/g, ' ')} b.).`;
    } else if (total_points) {
      note = `V rámci korekce ±${pct} % (${lo.toLocaleString('cs-CZ').replace(/,/g, ' ')}–${hi.toLocaleString('cs-CZ').replace(/,/g, ' ')} b.).`;
    }

    return {
      items,
      total_points,
      total_value_in_czk: Math.round(total_points * inflation),
      correction_pct: pct,
      correction_lo: lo,
      correction_hi: hi,
      note,
    };
  };

  window.loadSizesLocal = function (group) {
    return { group, sizes: window.SIZES_BY_GROUP[group] || [] };
  };
})();
