// Data pro kalkulačku - taxony, mikrohabitats, scales
// Pozn.: data jsou reprezentativní výňatek z metodiky AOPK ČR, pro demo účely

window.TAXONS = [
  // Listnaté - kategorie A (původní, vysoký význam)
  { cz: 'dub letní',         la: 'Quercus robur',       category: 'A', shape: 'kulová',     bio: 'vysoký',  regen: 'vysoká',  conifer: false },
  { cz: 'dub zimní',         la: 'Quercus petraea',     category: 'A', shape: 'kulová',     bio: 'vysoký',  regen: 'vysoká',  conifer: false },
  { cz: 'lípa srdčitá',      la: 'Tilia cordata',       category: 'A', shape: 'vejčitá',    bio: 'vysoký',  regen: 'vysoká',  conifer: false },
  { cz: 'lípa velkolistá',   la: 'Tilia platyphyllos',  category: 'A', shape: 'vejčitá',    bio: 'vysoký',  regen: 'vysoká',  conifer: false },
  { cz: 'buk lesní',         la: 'Fagus sylvatica',     category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'střední', conifer: false },
  { cz: 'javor mléč',        la: 'Acer platanoides',    category: 'A', shape: 'kulová',     bio: 'střední', regen: 'vysoká',  conifer: false },
  { cz: 'javor klen',        la: 'Acer pseudoplatanus', category: 'A', shape: 'kulová',     bio: 'střední', regen: 'vysoká',  conifer: false },
  { cz: 'jasan ztepilý',     la: 'Fraxinus excelsior',  category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'střední', conifer: false },
  { cz: 'habr obecný',       la: 'Carpinus betulus',    category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'vysoká',  conifer: false },
  { cz: 'bříza bělokorá',    la: 'Betula pendula',      category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'nízká',   conifer: false },
  { cz: 'olše lepkavá',      la: 'Alnus glutinosa',     category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'střední', conifer: false },
  { cz: 'topol černý',       la: 'Populus nigra',       category: 'A', shape: 'vejčitá',    bio: 'vysoký',  regen: 'střední', conifer: false },
  { cz: 'vrba bílá',         la: 'Salix alba',          category: 'A', shape: 'vejčitá',    bio: 'vysoký',  regen: 'střední', conifer: false },
  { cz: 'jeřáb obecný',      la: 'Sorbus aucuparia',    category: 'A', shape: 'vejčitá',    bio: 'střední', regen: 'vysoká',  conifer: false },
  // Listnaté - kategorie B (introdukované, méně cenné)
  { cz: 'jírovec maďal',     la: 'Aesculus hippocastanum', category: 'B', shape: 'kulová',  bio: 'střední', regen: 'střední', conifer: false },
  { cz: 'platan javorolistý', la: 'Platanus × hispanica',  category: 'B', shape: 'kulová',  bio: 'střední', regen: 'střední', conifer: false },
  // Jehličnaté
  { cz: 'borovice lesní',    la: 'Pinus sylvestris',    category: 'A', shape: 'kuželovitá', bio: 'střední', regen: 'nízká',   conifer: true  },
  { cz: 'borovice',          la: 'Pinus sp.',           category: 'A', shape: 'kuželovitá', bio: 'nízký',   regen: 'nízká',   conifer: true  },
  { cz: 'smrk ztepilý',      la: 'Picea abies',         category: 'B', shape: 'kuželovitá', bio: 'nízký',   regen: 'nízká',   conifer: true  },
  { cz: 'jedle bělokorá',    la: 'Abies alba',          category: 'A', shape: 'kuželovitá', bio: 'střední', regen: 'střední', conifer: true  },
  { cz: 'modřín opadavý',    la: 'Larix decidua',       category: 'A', shape: 'kuželovitá', bio: 'střední', regen: 'nízká',   conifer: true  },
  { cz: 'douglaska tisolistá', la: 'Pseudotsuga menziesii', category: 'B', shape: 'kuželovitá', bio: 'nízký', regen: 'nízká', conifer: true  },
  // Kategorie D - invazní
  { cz: 'trnovník akát',     la: 'Robinia pseudoacacia', category: 'D/B', shape: 'kulová',  bio: 'nízký',   regen: 'vysoká',  conifer: false },
];

window.MICRO_HABITATS = [
  { id: 1,  name: 'Dutiny od ptáků',           short: 'Ptačí dutiny',       icon: 'birdhole',    valuable: false },
  { id: 2,  name: 'Dutiny po větvích',         short: 'Větevní dutiny',     icon: 'branchhole',  valuable: false },
  { id: 3,  name: 'Hmyzí galerie a otvory',    short: 'Hmyzí galerie',      icon: 'galleries',   valuable: false },
  { id: 4,  name: 'Kmenové dutiny',            short: 'Kmenové dutiny',     icon: 'cavity',      valuable: true  },
  { id: 5,  name: 'Odlupující se borka',       short: 'Odchlípená kůra',    icon: 'peeling',     valuable: false },
  { id: 6,  name: 'Pahýly po větvích',         short: 'Pahýly',             icon: 'stumps',      valuable: false },
  { id: 7,  name: 'Plodnice hub',              short: 'Plodnice hub',       icon: 'fungi',       valuable: false },
  { id: 8,  name: 'Poškození borky',           short: 'Poškozená kůra',     icon: 'damage',      valuable: false },
  { id: 9,  name: 'Rozštípnuté dřevo',         short: 'Rozštípnutí',        icon: 'split',       valuable: true  },
  { id: 10, name: 'Suché odumřelé větve',      short: 'Suché větve',        icon: 'deadbranch',  valuable: false },
  { id: 11, name: 'Trhliny a nezahojené jizvy', short: 'Trhliny',           icon: 'cracks',      valuable: false },
  { id: 12, name: 'Vodní kapsy',               short: 'Vodní kapsy',        icon: 'waterpocket', valuable: false },
  { id: 13, name: 'Výtoky mízy a exudátů',     short: 'Výtoky mízy',        icon: 'sap',         valuable: false },
  { id: 14, name: 'Členité kořenové náběhy',   short: 'Kořenové náběhy',    icon: 'roots',       valuable: false },
];

window.VITALITY_OPTIONS = [
  { value: 1, label: 'výborná',     short: 'výb.', desc: 'Plně olistěná koruna, žádné suché větve.' },
  { value: 2, label: 'zřetelně sn.', short: 'sn.',  desc: 'Drobné odumírání, lehké prosychání.' },
  { value: 3, label: 'výrazně sn.', short: 'výr.', desc: 'Patrné odumírání částí koruny.' },
  { value: 4, label: 'zbytková',    short: 'zb.',  desc: 'Zbylo méně než 30 % funkční koruny.' },
  { value: 5, label: 'suchý',       short: 'such', desc: 'Strom je mrtvý.' },
];

window.HEALTH_OPTIONS = [
  { value: 1, label: 'výborný',     short: 'výb.', desc: 'Bez vad nebo s nepodstatnými vadami.' },
  { value: 2, label: 'zhoršený',    short: 'zh.',  desc: 'Lokální poškození, drobné dutiny.' },
  { value: 3, label: 'výr. zhoršený', short: 'výr.', desc: 'Závažnější vady stability.' },
  { value: 4, label: 'silně naruš.', short: 's.n.',  desc: 'Vysoké riziko rozpadu.' },
  { value: 5, label: 'havarijní',   short: 'hav.', desc: 'Strom v rozpadu.' },
];

window.LOCATION_OPTIONS = [
  { value: 'high',             label: 'vysoká',         coef: 1.0,  desc: 'Náměstí, centrum, památné místo' },
  { value: 'medium',           label: 'střední',        coef: 0.6,  desc: 'Sídliště, park, ulice' },
  { value: 'less_significant', label: 'méně významná',  coef: 0.4,  desc: 'Okraj sídla, sportoviště' },
  { value: 'low',              label: 'nízká',          coef: 0.25, desc: 'Průmysl, krajina mimo sídla' },
  { value: 'very_low',         label: 'velmi nízká',    coef: 0.1,  desc: 'Areály, vyloučené lokality' },
];

window.GROWTH_OPTIONS = [
  { value: 'unaffected', label: 'neovlivněné', coef: 1.0,  desc: 'Volný rozvoj kořenů i koruny' },
  { value: 'good',       label: 'dobré',       coef: 0.95, desc: 'Drobné omezení' },
  { value: 'impaired',   label: 'zhoršené',    coef: 0.8,  desc: 'Zpevněné plochy, omezení kořenů' },
  { value: 'extreme',    label: 'extrémní',    coef: 0.6,  desc: 'Silné poškození stanoviště' },
];

window.CUT_OPTIONS = [
  { value: 0,   label: 'bez poškození', coef: 1.0,  short: '0 %' },
  { value: 10,  label: '10 %', coef: 0.95, short: '10 %' },
  { value: 20,  label: '20 %', coef: 0.85, short: '20 %' },
  { value: 30,  label: '30 %', coef: 0.7,  short: '30 %' },
  { value: 40,  label: '40 %', coef: 0.55, short: '40 %' },
  { value: 50,  label: '50 %', coef: 0.4,  short: '50 %' },
  { value: 60,  label: '60 %', coef: 0.3,  short: '60 %' },
  { value: 70,  label: '70 %', coef: 0.2,  short: '70 %' },
  { value: 80,  label: '80 %', coef: 0.1,  short: '80 %' },
  { value: 90,  label: '90 %', coef: 0.05, short: '90 %' },
];

// Tabulkový objem koruny dle taxonu (m³) - reprezentativní hodnoty pro běžné stromy
// pro výpočet kroku 2 — poměr skutečný/tabulkový × ZBH (cap 1.0)
window.YEAR_INFO = {
  target_year: 2026,
  inflation_coefficient: 1.3543,
  note: 'Hodnoty v metodice jsou v cenové úrovni 2020.',
};

// Orientační velikosti výsadeb dle skupiny taxonu — MOCK (jen offline fallback)
// V produkci načítá frontend /api/sizes/:group
window.SIZES_BY_GROUP = {
  ls1: [ // Listnaté I — rychle rostoucí
    { size: '12/14', care_length_years: 3, base_value_points: 8000 },
    { size: '14/16', care_length_years: 3, base_value_points: 12000 },
    { size: '16/18', care_length_years: 3, base_value_points: 18000 },
    { size: '18/20', care_length_years: 5, base_value_points: 26000 },
    { size: '20/25', care_length_years: 5, base_value_points: 36000 },
  ],
  ls2: [ // Listnaté II — běžné
    { size: '12/14', care_length_years: 3, base_value_points: 10000 },
    { size: '14/16', care_length_years: 3, base_value_points: 15000 },
    { size: '16/18', care_length_years: 3, base_value_points: 22000 },
    { size: '18/20', care_length_years: 5, base_value_points: 32000 },
    { size: '20/25', care_length_years: 5, base_value_points: 44000 },
  ],
  ls3: [ // Listnaté III — vzácné
    { size: '12/14', care_length_years: 5, base_value_points: 14000 },
    { size: '14/16', care_length_years: 5, base_value_points: 21000 },
    { size: '16/18', care_length_years: 5, base_value_points: 31000 },
    { size: '18/20', care_length_years: 5, base_value_points: 44000 },
    { size: '20/25', care_length_years: 5, base_value_points: 60000 },
  ],
  js1: [ // Jehličnaté I
    { size: '60–80',   care_length_years: 3, base_value_points: 4500 },
    { size: '80–100',  care_length_years: 3, base_value_points: 7000 },
    { size: '100–125', care_length_years: 5, base_value_points: 10500 },
    { size: '125–150', care_length_years: 5, base_value_points: 14500 },
    { size: '150–175', care_length_years: 5, base_value_points: 19500 },
  ],
  js2: [ // Jehličnaté II
    { size: '60–80',   care_length_years: 3, base_value_points: 3500 },
    { size: '80–100',  care_length_years: 3, base_value_points: 5500 },
    { size: '100–125', care_length_years: 5, base_value_points: 8500 },
    { size: '125–150', care_length_years: 5, base_value_points: 11500 },
  ],
  lk: [ // Listnaté keře
    { size: '40–60',  care_length_years: 2, base_value_points: 900 },
    { size: '60–80',  care_length_years: 2, base_value_points: 1400 },
    { size: '80–100', care_length_years: 3, base_value_points: 2100 },
    { size: '100–125', care_length_years: 3, base_value_points: 3000 },
  ],
  jk: [ // Jehličnaté keře
    { size: '40–60',  care_length_years: 2, base_value_points: 1100 },
    { size: '60–80',  care_length_years: 2, base_value_points: 1700 },
    { size: '80–100', care_length_years: 3, base_value_points: 2500 },
  ],
};

window.GROUP_LABELS = {
  ls1: 'Listnaté I (rychle rostoucí)',
  ls2: 'Listnaté II (běžné)',
  ls3: 'Listnaté III (vzácné)',
  js1: 'Jehličnaté I',
  js2: 'Jehličnaté II',
  lk:  'Listnaté keře',
  jk:  'Jehličnaté keře',
};

window.MEASURE_TYPES = [
  { value: 'výchovný řez',                                     label: 'Výchovný řez (S-RV)',           needsHeight: true,  needsSpread: false, needsQuarters: false, basePerM: 220 },
  { value: 'zdravotní řez',                                    label: 'Zdravotní řez (S-RZ)',          needsHeight: true,  needsSpread: true,  needsQuarters: false, basePerM2: 95 },
  { value: 'bezpečnostní řez',                                 label: 'Bezpečnostní řez (S-RB)',       needsHeight: true,  needsSpread: true,  needsQuarters: false, basePerM2: 130 },
  { value: 'lokální redukce',                                  label: 'Lokální redukce (S-RLLR/SP/PV)', needsHeight: true, needsSpread: true,  needsQuarters: true,  basePerM2: 180 },
  { value: 'obvodová redukce',                                 label: 'Obvodová redukce (S-RO)',       needsHeight: true,  needsSpread: true,  needsQuarters: false, basePerM2: 260 },
  { value: 'instalace bezpečnostní vazby - statické',          label: 'Bezpečnostní vazba — statická', needsHeight: false, needsSpread: false, needsQuarters: false, flat: 8500 },
  { value: 'instalace bezpečnostní vazby - dynamické',         label: 'Bezpečnostní vazba — dynamická', needsHeight: false, needsSpread: false, needsQuarters: false, flat: 13500 },
];
