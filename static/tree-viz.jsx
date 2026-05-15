/* global React */
// Vizualizace stromu — reaguje na zadané parametry
// Props: { taxon, diameter, height, stemHeight, crownSpread, vitality, health, microHabitats, valuableMicroHabitats, width, height: canvasH, variant }

const TreeViz = (function () {
  const { useMemo } = React;

  // Mapping vitalita → barvy listů (od svěží zelené po mrtvý)
  const VITALITY_COLORS = {
    1: { dark: '#2d6a3e', fg: '#3f8e4f', mid: '#69ad6a', light: '#a8c98a', empty: 0.02 },
    2: { dark: '#516e2a', fg: '#6e8a3a', mid: '#9aaf52', light: '#c7c069', empty: 0.10 },
    3: { dark: '#6a5a30', fg: '#9c8a48', mid: '#b8a55b', light: '#c7b272', empty: 0.30 },
    4: { dark: '#5a4830', fg: '#7d6840', mid: '#9a8456', light: '#b59a6c', empty: 0.55 },
    5: { dark: '#46352a', fg: '#5a4530', mid: '#6f5840', light: '#7d6850', empty: 0.92 },
  };

  // Healh: ovlivňuje barvu kmene (zhoršený = více skvrn) — jen subtilně
  const HEALTH_TRUNK = {
    1: { base: '#6b4a30', shadow: '#3d2918' },
    2: { base: '#664530', shadow: '#3a2716' },
    3: { base: '#5e3f2b', shadow: '#352314' },
    4: { base: '#553a28', shadow: '#2f1f12' },
    5: { base: '#4a3424', shadow: '#291b0f' },
  };

  // PRNG s fixním seedem - deterministicky pro stejný strom
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Generuj klastry listů uvnitř koruny - tečkovaný "pointilismus"
  function generateLeafClusters(shape, w, h, count, seed) {
    const rng = mulberry32(seed);
    const clusters = [];
    let cx = w / 2;
    for (let i = 0; i < count; i++) {
      const rx = rng();
      const ry = rng();
      let x, y;
      if (shape === 'kuželovitá') {
        // Trojúhelník - širší dole
        y = ry * h;
        const widthAtY = (1 - y / h) * w * 0.45 + w * 0.05;
        x = cx + (rx - 0.5) * 2 * widthAtY;
      } else if (shape === 'sloupovitá') {
        // Úzký vysoký sloupec
        y = ry * h;
        x = cx + (rx - 0.5) * w * 0.45;
      } else if (shape === 'kulová') {
        // Kruh
        const angle = rx * Math.PI * 2;
        const r = Math.sqrt(ry) * Math.min(w, h) * 0.45;
        x = cx + Math.cos(angle) * r;
        y = h / 2 + Math.sin(angle) * r;
      } else {
        // vejčitá - elipsa svisle
        const angle = rx * Math.PI * 2;
        const r = Math.sqrt(ry);
        x = cx + Math.cos(angle) * r * w * 0.42;
        y = h / 2 + Math.sin(angle) * r * h * 0.46;
      }
      clusters.push({ x, y, r: 8 + rng() * 16, hue: rng() });
    }
    return clusters;
  }

  // Pozice mikrohabitats na kmeni / koruně
  function microHabitatMarks(habitats, valuable, trunkX, trunkW, trunkTop, trunkBottom, crownBox, seed) {
    const rng = mulberry32(seed + 1000);
    const marks = [];
    const valuableSet = new Set(valuable || []);
    (habitats || []).forEach((id) => {
      const isLarge = valuableSet.has(id);
      const onTrunk = [4, 5, 6, 7, 8, 11, 13].includes(id);
      let x, y;
      if (onTrunk) {
        const t = 0.2 + rng() * 0.6;
        x = trunkX + (rng() - 0.5) * trunkW * 0.6;
        y = trunkBottom - t * (trunkBottom - trunkTop);
      } else {
        x = crownBox.x + rng() * crownBox.w;
        y = crownBox.y + rng() * crownBox.h * 0.6;
      }
      marks.push({ id, x, y, large: isLarge });
    });
    return marks;
  }

  function MicroIcon({ id, x, y, large }) {
    const size = large ? 14 : 9;
    // Renderuj jednoduchou ikonku pro každý habitát
    const common = { transform: `translate(${x} ${y})` };
    switch (id) {
      case 1: case 2: // dutiny od ptáků / větví — tmavý kruh
        return <g {...common}><circle r={size * 0.55} fill="#1f1208" /></g>;
      case 4: // kmenové dutiny — větší ovál
        return <g {...common}><ellipse rx={size * 0.9} ry={size * 1.3} fill="#1a0f06" /></g>;
      case 7: // plodnice hub
        return <g {...common}>
          <ellipse cx={0} cy={-size * 0.3} rx={size * 0.8} ry={size * 0.45} fill="#d4936b" />
          <rect x={-size * 0.18} y={-size * 0.1} width={size * 0.36} height={size * 0.5} fill="#f0deba" />
        </g>;
      case 10: // suché větve — šedý klacek
        return <g {...common}>
          <path d={`M0,0 L${size * 1.4},${-size * 0.6}`} stroke="#8a8478" strokeWidth="1.5" strokeLinecap="round" />
        </g>;
      case 11: // trhliny — vertikální čára
        return <g {...common}>
          <path d={`M0,${-size * 0.8} L${size * 0.1},${size * 0.8}`} stroke="#1a0e05" strokeWidth="1.5" strokeLinecap="round" />
        </g>;
      case 5: case 8: // odlupující/poškozená borka
        return <g {...common}>
          <path d={`M0,0 Q${size * 0.6},${-size * 0.4} ${size * 0.8},${size * 0.2} Q${size * 0.3},${size * 0.4} 0,0 Z`} fill="#3d2818" stroke="#1f1208" strokeWidth="0.5" />
        </g>;
      case 13: // výtoky mízy
        return <g {...common}>
          <ellipse rx={size * 0.5} ry={size * 0.9} fill="#a87832" opacity="0.85" />
        </g>;
      default:
        return <g {...common}><circle r={size * 0.4} fill="#2c1a0a" opacity="0.7" /></g>;
    }
  }

  function TreeViz({
    taxon,
    diameter = 50,
    treeHeight: heightProp = 12,
    stemHeight = 4,
    crownSpread = 6,
    vitality = 1,
    health = 1,
    microHabitats = [],
    valuableMicroHabitats = [],
    memorial = false,
    width = 520,
    canvasHeight = 600,
    showLabels = false,
    background = 'transparent',
  }) {
    const W = width;
    const H = canvasHeight;
    const height = heightProp;
    const groundY = H - 40;
    const skyTop = 20;

    // Měřítka — typický strom 5–25m, fill ~ 85–95% výšky
    const maxRealH = 24;
    const realH = Math.max(2, Math.min(maxRealH, height || 12));
    const treeTotalPx = (realH / maxRealH) * (groundY - skyTop) * 0.98;

    const realStemH = Math.max(0.5, Math.min(realH * 0.8, stemHeight || realH * 0.35));
    const stemPxFrac = realStemH / realH;
    const trunkH = treeTotalPx * stemPxFrac;
    const crownH = treeTotalPx - trunkH;

    // Šířka kmene — 0–150 cm → 8–60 px (kořeny pod tím trochu rozšířené)
    const d = Math.max(5, Math.min(200, diameter || 30));
    const trunkW = 6 + (d / 150) * 38;

    // Šířka koruny — 0–25 m → odpovídající px
    const cs = Math.max(0.5, crownSpread || Math.max(3, realH * 0.4));
    const crownW = Math.min(W * 0.85, (cs / 25) * (W * 0.85));

    const cx = W / 2;
    const trunkTop = groundY - trunkH;
    const crownTop = trunkTop - crownH;
    const crownLeft = cx - crownW / 2;

    const vitalPalette = VITALITY_COLORS[vitality] || VITALITY_COLORS[1];
    const trunkPalette = HEALTH_TRUNK[health] || HEALTH_TRUNK[1];

    // Tvar koruny — podle taxon.shape (default vejčitá)
    // Backend posílá tvary bez diakritiky (kuzelovita / kulovita / sloupovita / zaoblena / jiny);
    // mock data.js používá tvary s diakritikou. Mapujeme oboje na jednu sadu.
    const SHAPE_NORMALIZE = {
      'kuzelovita': 'kuželovitá', 'kuželovitá': 'kuželovitá',
      'sloupovita': 'sloupovitá', 'sloupovitá': 'sloupovitá',
      'kulovita': 'kulová', 'kulová': 'kulová',
      'zaoblena': 'vejčitá', 'vejčitá': 'vejčitá',
      'jiny': 'vejčitá',
    };
    const shape = SHAPE_NORMALIZE[taxon?.shape] || 'vejčitá';
    const conifer = !!taxon?.conifer;

    // Listové klastry
    const seed = Math.round(d * 17 + realH * 31 + cs * 7);
    const baseCount = Math.round(crownW * crownH / 180);
    const clusters = useMemo(
      () => generateLeafClusters(shape, crownW, crownH, baseCount, seed),
      [shape, crownW, crownH, baseCount, seed]
    );

    // Ořezová cesta pro tvar koruny
    const clipId = `crown-clip-${seed}`;
    let crownPath;
    let crownCenterX = cx;
    let crownCenterY;
    if (shape === 'kuželovitá') {
      crownPath = `M ${cx} ${crownTop} L ${cx + crownW / 2} ${trunkTop} L ${cx - crownW / 2} ${trunkTop} Z`;
      crownCenterY = (crownTop + trunkTop) / 2;
    } else if (shape === 'sloupovitá') {
      const r = Math.min(crownW * 0.4, 40);
      crownPath = `M ${crownLeft + r} ${crownTop} L ${crownLeft + crownW - r} ${crownTop} Q ${crownLeft + crownW} ${crownTop} ${crownLeft + crownW} ${crownTop + r} L ${crownLeft + crownW} ${trunkTop - r} Q ${crownLeft + crownW} ${trunkTop} ${crownLeft + crownW - r} ${trunkTop} L ${crownLeft + r} ${trunkTop} Q ${crownLeft} ${trunkTop} ${crownLeft} ${trunkTop - r} L ${crownLeft} ${crownTop + r} Q ${crownLeft} ${crownTop} ${crownLeft + r} ${crownTop} Z`;
      crownCenterY = (crownTop + trunkTop) / 2;
    } else if (shape === 'kulová') {
      const r = Math.min(crownW, crownH) / 2;
      const cyC = trunkTop - r;
      // Dva půlkruhové oblouky (sweep=1 → consistent CW circle)
      crownPath = `M ${cx - r} ${cyC} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0 Z`;
      crownCenterY = cyC;
    } else {
      // vejčitá — elipsa
      const rx = crownW / 2;
      const ry = crownH / 2;
      const ccy = (crownTop + trunkTop) / 2;
      crownPath = `M ${cx - rx} ${ccy} a ${rx} ${ry} 0 1 1 ${2 * rx} 0 a ${rx} ${ry} 0 1 1 ${-2 * rx} 0 Z`;
      crownCenterY = ccy;
    }

    // Mikrohabitats — pozice
    const crownBox = { x: crownLeft, y: crownTop, w: crownW, h: crownH };
    const marks = useMemo(
      () => microHabitatMarks(microHabitats, valuableMicroHabitats, cx, trunkW, trunkTop, groundY - 5, crownBox, seed),
      [microHabitats, valuableMicroHabitats, cx, trunkW, trunkTop, groundY, crownBox.x, crownBox.y, crownBox.w, crownBox.h, seed]
    );

    // "Sun" pamatny strom - zlatá záře
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ display: 'block', background, overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={crownPath} />
          </clipPath>
          <linearGradient id={`trunk-grad-${seed}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={trunkPalette.shadow} />
            <stop offset="0.35" stopColor={trunkPalette.base} />
            <stop offset="0.65" stopColor={trunkPalette.base} />
            <stop offset="1" stopColor={trunkPalette.shadow} />
          </linearGradient>
          <radialGradient id={`crown-grad-${seed}`} cx="0.3" cy="0.25" r="0.85">
            <stop offset="0" stopColor={vitalPalette.light} />
            <stop offset="0.4" stopColor={vitalPalette.fg} />
            <stop offset="0.85" stopColor={vitalPalette.dark} />
          </radialGradient>
          <radialGradient id={`memorial-glow-${seed}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f3c948" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f3c948" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Památný strom záře */}
        {memorial && (
          <ellipse cx={cx} cy={(crownTop + trunkTop) / 2} rx={crownW * 0.75} ry={crownH * 0.7} fill={`url(#memorial-glow-${seed})`} />
        )}

        {/* Zem / horizontála */}
        <ellipse cx={cx} cy={groundY + 2} rx={Math.max(40, crownW * 0.45)} ry={6} fill="rgba(20,15,8,0.18)" />
        <line x1="0" x2={W} y1={groundY} y2={groundY} stroke="#d8d3c4" strokeWidth="1" strokeDasharray="2,4" />

        {/* Kmen */}
        <path
          d={`M ${cx - trunkW / 2} ${groundY} 
              C ${cx - trunkW / 2 - 6} ${groundY - trunkH * 0.3}, ${cx - trunkW / 2 + 2} ${groundY - trunkH * 0.6}, ${cx - trunkW / 2 + 1} ${trunkTop}
              L ${cx + trunkW / 2 - 1} ${trunkTop}
              C ${cx + trunkW / 2 - 2} ${groundY - trunkH * 0.6}, ${cx + trunkW / 2 + 6} ${groundY - trunkH * 0.3}, ${cx + trunkW / 2} ${groundY} Z`}
          fill={`url(#trunk-grad-${seed})`}
        />
        {/* Kořenové náběhy pokud zaškrtnuto (id 14) */}
        {(microHabitats || []).includes(14) && (
          <>
            <path d={`M ${cx - trunkW / 2 - 6} ${groundY} Q ${cx - trunkW / 2 - 14} ${groundY - 6} ${cx - trunkW / 2 - 2} ${groundY - 14} Z`} fill={trunkPalette.shadow} />
            <path d={`M ${cx + trunkW / 2 + 6} ${groundY} Q ${cx + trunkW / 2 + 14} ${groundY - 6} ${cx + trunkW / 2 + 2} ${groundY - 14} Z`} fill={trunkPalette.shadow} />
          </>
        )}

        {/* Koruna - silueta s gradientem pro objem */}
        <path d={crownPath} fill={`url(#crown-grad-${seed})`} opacity={1 - vitalPalette.empty * 0.7} />

        {/* Pro jehličnany - vrstvy větví */}
        {conifer && (
          <g clipPath={`url(#${clipId})`}>
            {Array.from({ length: 9 }).map((_, i) => {
              const layerY = crownTop + (i / 9) * crownH;
              const layerW = (1 - i / 9) * crownW * 0.95 + 12;
              return (
                <ellipse
                  key={i}
                  cx={cx}
                  cy={layerY}
                  rx={layerW / 2}
                  ry={crownH * 0.07}
                  fill={i % 2 === 0 ? vitalPalette.fg : vitalPalette.mid}
                  opacity={1 - vitalPalette.empty * 0.5}
                />
              );
            })}
          </g>
        )}

        {/* Listové klastry uvnitř — řidší, výraznější */}
        <g clipPath={`url(#${clipId})`} transform={`translate(${crownLeft} ${crownTop})`}>
          {clusters.filter((c, i) => i % 3 === 0).map((c, i) => {
            const lightSide = (c.x / crownW) < 0.55 && (c.y / crownH) < 0.5;
            let color;
            if (lightSide) {
              color = c.hue < 0.5 ? vitalPalette.light : vitalPalette.mid;
            } else {
              color = c.hue < 0.5 ? vitalPalette.dark : vitalPalette.fg;
            }
            const r = c.r * (conifer ? 0.45 : 0.8);
            return <circle key={i} cx={c.x} cy={c.y} r={r} fill={color} opacity={lightSide ? 0.75 : 0.55} />;
          })}
        </g>

        {/* Suché větve - když vitalita >= 3 */}
        {vitality >= 3 && (
          <g stroke={trunkPalette.shadow} strokeWidth="1.2" fill="none" opacity={0.6}>
            {Array.from({ length: 4 + vitality }).map((_, i) => {
              const angle = (i / (3 + vitality)) * Math.PI - Math.PI / 2;
              const r1 = crownH * 0.2;
              const r2 = crownH * 0.4 + (i % 2) * 8;
              const ccy = (crownTop + trunkTop) / 2;
              return (
                <path
                  key={i}
                  d={`M ${cx + Math.cos(angle) * r1} ${ccy + Math.sin(angle) * r1} L ${cx + Math.cos(angle) * r2} ${ccy + Math.sin(angle) * r2 - 4}`}
                />
              );
            })}
          </g>
        )}

        {/* Mikrohabitats ikony */}
        <g>
          {marks.map((m, i) => <MicroIcon key={i} {...m} />)}
        </g>

        {/* Měřítka */}
        {showLabels && (
          <g fontFamily="ui-monospace, monospace" fontSize="10" fill="#7a7568">
            {/* výška */}
            <line x1={W - 30} x2={W - 30} y1={groundY} y2={trunkTop + 8} stroke="#c4bfb0" strokeWidth="0.5" />
            <line x1={W - 34} x2={W - 26} y1={groundY} y2={groundY} stroke="#c4bfb0" />
            <line x1={W - 34} x2={W - 26} y1={trunkTop + 8} y2={trunkTop + 8} stroke="#c4bfb0" />
            <text x={W - 22} y={(groundY + trunkTop) / 2} dominantBaseline="middle">{realH.toFixed(1)} m</text>
            {/* průměr kmene */}
            <text x={cx} y={groundY + 15} textAnchor="middle">∅ {d.toFixed(0)} cm</text>
            {/* průměr koruny */}
            <line x1={cx - crownW / 2} x2={cx + crownW / 2} y1={crownTop - 12} y2={crownTop - 12} stroke="#c4bfb0" strokeWidth="0.5" />
            <text x={cx} y={crownTop - 18} textAnchor="middle">koruna {cs.toFixed(1)} m</text>
          </g>
        )}
      </svg>
    );
  }

  return TreeViz;
})();

window.TreeViz = TreeViz;
