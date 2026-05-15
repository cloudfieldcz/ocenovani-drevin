// API klient pro kalkulačku oceňování dřevin
// Pokouší se volat backend (/api/...), při selhání spadne na lokální výpočet.
// Pro produkci: nastav window.OCENOVANI_API = '' nebo URL backendu.

(function () {
  const API_BASE = (typeof window !== 'undefined' && window.OCENOVANI_API) || '';
  const USE_LOCAL_FALLBACK = true; // přepni na false pro striktní API mód

  async function tryFetch(path, options) {
    try {
      const res = await fetch(API_BASE + path, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Načtení taxonů — preferuj API, padni na window.TAXONS
  window.loadTaxons = async function () {
    const remote = await tryFetch('/api/taxons');
    if (remote) return remote;
    if (USE_LOCAL_FALLBACK && window.TAXONS) {
      return window.TAXONS.map((t) => ({
        cz: t.cz, la: t.la, category: t.category,
        shape: t.shape, regenerability: t.regen, bio_significance: t.bio,
      }));
    }
    throw new Error('Nepodařilo se načíst seznam taxonů.');
  };

  // Načtení informace o roce / inflaci
  window.loadYearInfo = async function () {
    const remote = await tryFetch('/api/year-info');
    if (remote) return remote;
    if (USE_LOCAL_FALLBACK && window.YEAR_INFO) {
      return window.YEAR_INFO;
    }
    throw new Error('Nepodařilo se načíst informace o roce.');
  };

  // Hlavní výpočet — preferuj API, padni na lokální calculateTree (data.js + calc.js)
  window.calculate = async function (input) {
    const remote = await tryFetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (remote) return remote;
    if (USE_LOCAL_FALLBACK && window.calculateTree) {
      return window.calculateTree(input);
    }
    throw new Error('Nepodařilo se vypočítat hodnotu.');
  };

  // Kompenzační opatření
  window.calculateCompensation = async function (input) {
    const remote = await tryFetch('/api/compensation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (remote) return remote;
    if (USE_LOCAL_FALLBACK && window.calculateCompensationLocal) {
      return window.calculateCompensationLocal(input);
    }
    throw new Error('Kompenzační výpočet vyžaduje backend.');
  };

  // Velikosti výsadeb dle skupiny taxonu
  window.loadSizes = async function (group) {
    const remote = await tryFetch(`/api/sizes/${encodeURIComponent(group)}`);
    if (remote) return remote;
    if (USE_LOCAL_FALLBACK && window.loadSizesLocal) {
      return window.loadSizesLocal(group);
    }
    throw new Error('Načtení velikostí vyžaduje backend.');
  };
})();
