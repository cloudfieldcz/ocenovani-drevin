/* global React */
// Waterfall diagram - vizualizace 9-krokového výpočtu
// Props: { result, width, height, variant }

const Waterfall = (function () {
  function Waterfall({ result, width = 680, height = 260, accent = '#2d6a3e', subtle = '#a8c98a' }) {
    if (!result) return null;
    const r = result;

    // Steps in order, each: {label, value, delta_from_prev}
    const steps = [];
    steps.push({ key: 'zbh', label: 'ZBH', sub: 'základ', value: r.step_1_zbh, prev: 0 });
    steps.push({ key: 'crown', label: 'Objem koruny', sub: r.crown_ratio != null ? `× ${(r.crown_ratio).toFixed(2).replace('.', ',')}` : 'nepřepočítáno', value: r.step_2_after_crown, prev: r.step_1_zbh });
    steps.push({ key: 'health', label: 'Zdraví × vitalita', sub: `× ${window.fmtCoef(r.health_coefficient)}`, value: r.step_3_after_health, prev: r.step_2_after_crown });
    if (r.cut_coefficient != null) {
      steps.push({ key: 'cut', label: 'Nevhodný řez', sub: `× ${window.fmtCoef(r.cut_coefficient)}`, value: r.step_4_after_cut, prev: r.step_3_after_health });
    }
    steps.push({ key: 'loc', label: 'Poloha', sub: `× ${window.fmtCoef(r.location_coefficient)}`, value: r.step_5_after_location, prev: r.step_4_after_cut });
    if (r.bio_points >= 2) {
      steps.push({ key: 'bio', label: 'Biopotenciál', sub: `+ ${r.bio_points} b. × bio`, value: r.step_5_after_location + r.step_6_bio_value, prev: r.step_5_after_location });
      steps.push({ key: 'taxbio', label: 'Bio význam taxonu', sub: `× ${window.fmtCoef(r.taxon_bio_coefficient)}`, value: r.step_7_after_taxon_bio, prev: r.step_5_after_location + r.step_6_bio_value });
    }
    steps.push({ key: 'final', label: 'Celkem bodů', sub: 'krok 8', value: r.step_8_final_points, prev: r.step_8_final_points, isFinal: true });

    const maxV = Math.max(r.step_1_zbh, 1);
    const pad = { left: 16, right: 16, top: 26, bottom: 56 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const colW = innerW / steps.length;
    const barW = Math.min(colW * 0.65, 64);

    const yFor = (v) => pad.top + innerH - (v / maxV) * innerH;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
        {/* horizontální čára pod */}
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH + 0.5} y2={pad.top + innerH + 0.5} stroke="#d8d3c4" strokeWidth="1" />

        {steps.map((s, i) => {
          const cx = pad.left + colW * i + colW / 2;
          const yTop = yFor(s.value);
          const yPrev = yFor(s.prev);
          const yBase = pad.top + innerH;
          const isFinal = s.isFinal;
          const isStart = i === 0;
          const isPositive = s.value >= s.prev;
          let bar;
          if (isStart || isFinal) {
            bar = (
              <rect
                x={cx - barW / 2}
                y={yTop}
                width={barW}
                height={yBase - yTop}
                fill={isFinal ? accent : subtle}
                rx="2"
              />
            );
          } else {
            const topY = Math.min(yTop, yPrev);
            const bottomY = Math.max(yTop, yPrev);
            bar = (
              <rect
                x={cx - barW / 2}
                y={topY}
                width={barW}
                height={Math.max(2, bottomY - topY)}
                fill={isPositive ? subtle : '#d4937a'}
                rx="2"
                opacity="0.95"
              />
            );
          }

          // spojovací čárky (krokový schodek)
          const connector = i < steps.length - 1 && !isFinal ? (
            <line
              x1={cx + barW / 2}
              x2={pad.left + colW * (i + 1) + colW / 2 - barW / 2}
              y1={yTop}
              y2={yTop}
              stroke="#b8b2a2"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ) : null;

          return (
            <g key={s.key}>
              {connector}
              {bar}
              {/* hodnota nad sloupcem */}
              <text
                x={cx}
                y={yTop - 6}
                textAnchor="middle"
                fontSize="11"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill={isFinal ? accent : '#3a3a36'}
                fontWeight={isFinal ? 700 : 500}
              >
                {window.fmtNum(s.value)}
              </text>
              {/* štítek dole */}
              <text x={cx} y={yBase + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#3a3a36">
                {s.label}
              </text>
              <text x={cx} y={yBase + 30} textAnchor="middle" fontSize="10" fill="#7a7568" fontFamily="ui-monospace, monospace">
                {s.sub}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return Waterfall;
})();

window.Waterfall = Waterfall;
