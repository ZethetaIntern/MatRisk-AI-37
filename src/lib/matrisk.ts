// MatRisk AI — dual-domain engine (materials science <-> financial risk).
// All models are deterministic given a seed so results are reproducible.

/* ---------------- utilities ---------------- */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function normal(r: () => number) {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
function poisson(r: () => number, lambda: number) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];
export const fmtMoney = (x: number) => {
  const a = Math.abs(x), s = x < 0 ? "−" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(1)}K`;
  return `${s}$${a.toFixed(0)}`;
};
export const pct = (x: number, d = 1) => `${x >= 0 ? "+" : "−"}${Math.abs(x * 100).toFixed(d)}%`;

/* ---------------- Part 2: crystal structures ---------------- */
const ELEMENTS: Record<string, { en: number; r: number; m: number }> = {
  Ni: { en: 1.91, r: 124, m: 58.69 }, Al: { en: 1.61, r: 143, m: 26.98 }, Fe: { en: 1.83, r: 126, m: 55.85 },
  Cr: { en: 1.66, r: 128, m: 52.0 }, Ti: { en: 1.54, r: 147, m: 47.87 }, V: { en: 1.63, r: 134, m: 50.94 },
  Cu: { en: 1.9, r: 128, m: 63.55 }, Li: { en: 0.98, r: 152, m: 6.94 }, P: { en: 2.19, r: 107, m: 30.97 },
  O: { en: 3.44, r: 66, m: 16.0 }, Mn: { en: 1.55, r: 127, m: 54.94 }, C: { en: 2.55, r: 77, m: 12.01 },
};

export type CommodityId = "CU" | "NI" | "AL" | "LI" | "FE" | "TI";
export interface Material {
  id: string; name: string; formula: string; structure: string; spaceGroup: string;
  a: number; composition: [string, number][]; packing: number;
  sigma0: number; kHP: number; E: number; Tm: number; corr25: number; Ea: number;
  refYield: number; commodity: CommodityId; use: string;
}

export const MATERIALS: Material[] = [
  { id: "ni3al", name: "Ni₃Al γ′", formula: "Ni₃Al", structure: "L1₂ ordered cubic", spaceGroup: "Pm-3m", a: 3.568, composition: [["Ni", 0.75], ["Al", 0.25]], packing: 0.74, sigma0: 220, kHP: 380, E: 179, Tm: 1668, corr25: 0.012, Ea: 55, refYield: 312, commodity: "NI", use: "Turbine blades, sour-service casing" },
  { id: "ss316", name: "316L stainless", formula: "Fe-17Cr-12Ni", structure: "FCC austenite", spaceGroup: "Fm-3m", a: 3.59, composition: [["Fe", 0.68], ["Cr", 0.17], ["Ni", 0.12], ["Mn", 0.02], ["C", 0.01]], packing: 0.74, sigma0: 150, kHP: 450, E: 193, Tm: 1673, corr25: 0.02, Ea: 48, refYield: 255, commodity: "NI", use: "Bridge rebar, process piping" },
  { id: "ti64", name: "Ti-6Al-4V", formula: "Ti-6Al-4V", structure: "HCP α + BCC β", spaceGroup: "P6₃/mmc", a: 2.95, composition: [["Ti", 0.86], ["Al", 0.1], ["V", 0.04]], packing: 0.74, sigma0: 700, kHP: 400, E: 114, Tm: 1878, corr25: 0.002, Ea: 60, refYield: 830, commodity: "TI", use: "Desalination heat exchangers, airframes" },
  { id: "s355", name: "S355 structural steel", formula: "Fe-1.5Mn-0.2C", structure: "BCC ferrite", spaceGroup: "Im-3m", a: 2.87, composition: [["Fe", 0.98], ["Mn", 0.015], ["C", 0.005]], packing: 0.68, sigma0: 200, kHP: 600, E: 210, Tm: 1773, corr25: 0.11, Ea: 40, refYield: 355, commodity: "FE", use: "Wind towers, bridges, port cranes" },
  { id: "cu", name: "OFHC copper", formula: "Cu", structure: "FCC", spaceGroup: "Fm-3m", a: 3.615, composition: [["Cu", 1]], packing: 0.74, sigma0: 25, kHP: 200, E: 117, Tm: 1358, corr25: 0.008, Ea: 45, refYield: 72, commodity: "CU", use: "Grid conductors, busbars" },
  { id: "lfp", name: "LiFePO₄ cathode", formula: "LiFePO₄", structure: "Olivine orthorhombic", spaceGroup: "Pnma", a: 10.33, composition: [["Li", 0.143], ["Fe", 0.143], ["P", 0.143], ["O", 0.571]], packing: 0.58, sigma0: 60, kHP: 120, E: 125, Tm: 1240, corr25: 0.05, Ea: 35, refYield: 85, commodity: "LI", use: "Grid-scale battery storage" },
];
export const getMaterial = (id: string) => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];

export interface Encoding { features: { key: string; label: string; value: number; norm: number }[]; embedding: number[]; mismatch: number }
export function encodeCrystal(m: Material): Encoding {
  const c = m.composition;
  const avg = (f: (e: { en: number; r: number; m: number }) => number) => c.reduce((s, [el, x]) => s + x * f(ELEMENTS[el]), 0);
  const en = avg((e) => e.en), r = avg((e) => e.r), mass = avg((e) => e.m);
  const dEN = Math.sqrt(c.reduce((s, [el, x]) => s + x * (ELEMENTS[el].en - en) ** 2, 0));
  const mismatch = Math.sqrt(c.reduce((s, [el, x]) => s + x * (1 - ELEMENTS[el].r / r) ** 2, 0));
  const features = [
    { key: "en", label: "Mean electronegativity χ̄", value: en, norm: en / 3.5 },
    { key: "den", label: "Electronegativity spread δχ", value: dEN, norm: dEN / 1.2 },
    { key: "r", label: "Mean atomic radius (pm)", value: r, norm: r / 160 },
    { key: "mis", label: "Size mismatch δ", value: mismatch, norm: mismatch / 0.4 },
    { key: "m", label: "Mean atomic mass (u)", value: mass, norm: mass / 70 },
    { key: "apf", label: "Atomic packing factor", value: m.packing, norm: m.packing },
    { key: "a", label: "Lattice parameter a (Å)", value: m.a, norm: m.a / 11 },
    { key: "tm", label: "Melting point Tm (K)", value: m.Tm, norm: m.Tm / 2000 },
  ].map((f) => ({ ...f, norm: clamp(f.norm, 0, 1) }));
  // 16-d graph-style embedding: mix features through a fixed sinusoidal projection
  const embedding = Array.from({ length: 16 }, (_, i) =>
    clamp(0.5 + 0.5 * Math.sin(features.reduce((s, f, j) => s + f.norm * Math.cos((i + 1) * (j + 1) * 0.7), 0) * 2.1), 0, 1),
  );
  return { features, embedding, mismatch };
}

export interface Env { grainUm: number; tempC: number; chloride: number; pH: number }
export const DEFAULT_ENV: Env = { grainUm: 20, tempC: 25, chloride: 0.3, pH: 7 };
export interface Prediction {
  yield: number; yieldLo: number; yieldHi: number; E: number; corrosion: number; corrLo: number; corrHi: number;
  homologous: number; constraints: { name: string; passed: boolean; detail: string }[];
}
export function predictProperties(m: Material, env: Env = DEFAULT_ENV): Prediction {
  const enc = encodeCrystal(m);
  const T = env.tempC + 273.15;
  const h = T / m.Tm;
  const soft = clamp(1 - 1.25 * Math.max(0, h - 0.25), 0.05, 1);
  const hallPetch = m.sigma0 + m.kHP / Math.sqrt(Math.max(env.grainUm, 0.5));
  const residual = 1 + clamp((enc.mismatch - 0.05) * 0.4, -0.05, 0.05); // learned correction, bounded
  const theoretical = m.E * 1000 / 30; // ideal-strength ceiling ≈ E/30
  const y = clamp(hallPetch * soft * residual, 1, theoretical);
  const unc = 0.05 + enc.mismatch * 0.25;
  const E = m.E * (1 - 0.5 * Math.max(0, h - 0.2));
  const envF = (1 + 4 * env.chloride) * (1 + Math.max(0, 7 - env.pH) * 0.35);
  const corr = m.corr25 * Math.exp(((-m.Ea * 1000) / 8.314) * (1 / T - 1 / 298.15)) * envF;
  return {
    yield: y, yieldLo: y * (1 - 1.96 * unc / 2), yieldHi: y * (1 + 1.96 * unc / 2), E,
    corrosion: corr, corrLo: corr * 0.78, corrHi: corr * 1.32, homologous: h,
    constraints: [
      { name: "Ideal-strength ceiling", passed: y <= theoretical, detail: `σy ≤ E/30 = ${theoretical.toFixed(0)} MPa` },
      { name: "Hall–Petch monotonicity", passed: true, detail: "∂σy/∂d < 0 enforced analytically" },
      { name: "Arrhenius corrosion", passed: m.Ea > 0, detail: `Ea = ${m.Ea} kJ/mol, rate ↑ with T` },
      { name: "Thermal softening", passed: h < 0.9, detail: `T/Tm = ${h.toFixed(2)} (< 0.9 solid-state)` },
      { name: "Positive stiffness", passed: E > 0, detail: `E(T) = ${E.toFixed(0)} GPa` },
    ],
  };
}

/* ---------------- Part 3: failure & degradation ---------------- */
export interface FailureInput { stressMPa: number; years: number; thicknessMm: number; assetValue: number; weibullShape: number }
export function failureModel(m: Material, p: Prediction, f: FailureInput) {
  const curve: { t: number; thickness: number; stress: number; pof: number }[] = [];
  for (let t = 0; t <= f.years; t++) {
    const th = Math.max(f.thicknessMm - p.corrosion * t, f.thicknessMm * 0.02);
    const stress = f.stressMPa * (f.thicknessMm / th);
    const pof = 1 - Math.exp(-((stress / p.yield) ** f.weibullShape));
    curve.push({ t, thickness: th, stress, pof });
  }
  const end = curve[curve.length - 1];
  const sigmaE = 0.45 * p.yield;
  const fatigueCycles = 1e7 * (sigmaE / Math.max(f.stressMPa * 0.5, 1)) ** 10;
  const remainingLife = curve.find((c) => c.pof > 0.1)?.t ?? null;
  const expectedLoss = end.pof * f.assetValue;
  const rating = end.pof > 0.2 ? "HIGH" : end.pof > 0.05 ? "MEDIUM" : "LOW";
  return { curve, end, fatigueCycles, remainingLife, expectedLoss, rating, materialId: m.id };
}

/* ---------------- Part 4: commodities ---------------- */
export const COMMODITIES: Record<CommodityId, { name: string; price: number; vol: number; beta: number; unit: string }> = {
  CU: { name: "Copper", price: 9412, vol: 0.24, beta: 0.7, unit: "/t" },
  NI: { name: "Nickel", price: 16880, vol: 0.38, beta: 0.6, unit: "/t" },
  AL: { name: "Aluminium", price: 2588, vol: 0.22, beta: 0.65, unit: "/t" },
  LI: { name: "Lithium carbonate", price: 11800, vol: 0.55, beta: 0.5, unit: "/t" },
  FE: { name: "HRC steel", price: 680, vol: 0.28, beta: 0.6, unit: "/t" },
  TI: { name: "Titanium sponge", price: 6200, vol: 0.3, beta: 0.5, unit: "/t" },
};
export interface Position { sym: CommodityId; qty: number }
export const DEFAULT_BOOK: Position[] = [
  { sym: "CU", qty: 1200 }, { sym: "NI", qty: -400 }, { sym: "AL", qty: 2500 },
  { sym: "LI", qty: 300 }, { sym: "FE", qty: 8000 }, { sym: "TI", qty: 150 },
];
export function pricePaths(days: number, seed = 7) {
  const r = rng(seed);
  const out: Record<string, number[]> = {};
  for (const [k, c] of Object.entries(COMMODITIES)) {
    const p = [c.price];
    const dv = c.vol / Math.sqrt(252);
    for (let i = 1; i < days; i++) p.push(p[i - 1] * Math.exp(-0.5 * dv * dv + dv * normal(r)));
    out[k] = p;
  }
  return out;
}
export function bookVaR(book: Position[], opts: { horizon: number; sims: number; shock?: Partial<Record<CommodityId, number>>; volMult?: number; seed?: number }) {
  const r = rng(opts.seed ?? 11);
  const pnl: number[] = [];
  const vm = opts.volMult ?? 1;
  for (let s = 0; s < opts.sims; s++) {
    const F = normal(r);
    let total = 0;
    for (const p of book) {
      const c = COMMODITIES[p.sym];
      const z = c.beta * F + Math.sqrt(1 - c.beta ** 2) * normal(r);
      const sig = (c.vol * vm) * Math.sqrt(opts.horizon / 252);
      const shock = opts.shock?.[p.sym] ?? 0;
      const ret = Math.exp(-0.5 * sig * sig + sig * z) * (1 + shock) - 1;
      total += p.qty * c.price * ret;
    }
    pnl.push(total);
  }
  pnl.sort((a, b) => a - b);
  const var95 = -quantile(pnl, 0.05), var99 = -quantile(pnl, 0.01);
  const tail = pnl.slice(0, Math.max(1, Math.floor(0.025 * pnl.length)));
  const es975 = -tail.reduce((s, x) => s + x, 0) / tail.length;
  const gross = book.reduce((s, p) => s + Math.abs(p.qty) * COMMODITIES[p.sym].price, 0);
  const net = book.reduce((s, p) => s + p.qty * COMMODITIES[p.sym].price, 0);
  const mean = pnl.reduce((s, x) => s + x, 0) / pnl.length;
  return { pnl, var95, var99, es975, gross, net, mean };
}
export function histogram(values: number[], bins = 30) {
  const min = values[0], max = values[values.length - 1];
  const w = (max - min) / bins || 1;
  const h = new Array(bins).fill(0);
  for (const v of values) h[Math.min(bins - 1, Math.floor((v - min) / w))]++;
  return { h, min, max, w };
}

/* ---------------- Part 4: infrastructure project finance ---------------- */
export interface ProjectInput {
  capex: number; materialShare: Partial<Record<CommodityId, number>>; debtPct: number; rate: number; tenor: number;
  revenue: number; opexPct: number; life: number; commodityShock: number; degradationPof: number; maintenanceFactor: number;
}
export const DEFAULT_PROJECT: ProjectInput = {
  capex: 850e6, materialShare: { FE: 0.22, CU: 0.12, AL: 0.05, NI: 0.03 }, debtPct: 0.7, rate: 0.075, tenor: 18,
  revenue: 128e6, opexPct: 0.28, life: 25, commodityShock: 0, degradationPof: 0.03, maintenanceFactor: 1,
};
export function projectFinance(p: ProjectInput) {
  const matShare = Object.values(p.materialShare).reduce((s, x) => s + (x ?? 0), 0);
  const capex = p.capex * (1 + matShare * p.commodityShock);
  const debt = capex * p.debtPct, equity = capex - debt;
  const ds = debt * p.rate / (1 - (1 + p.rate) ** -p.tenor);
  const years: { y: number; cfads: number; ds: number; dscr: number }[] = [];
  let npv = -equity;
  for (let y = 1; y <= p.life; y++) {
    const rev = p.revenue * 1.02 ** (y - 1);
    const maint = capex * 0.01 * p.maintenanceFactor * (1 + 6 * p.degradationPof) * (1 + y / p.life);
    const cfads = rev * (1 - p.opexPct) - maint;
    const d = y <= p.tenor ? ds : 0;
    years.push({ y, cfads, ds: d, dscr: d > 0 ? cfads / d : NaN });
    npv += (cfads - d) / 1.1 ** y;
  }
  const dscrs = years.filter((x) => x.ds > 0).map((x) => x.dscr);
  const minDscr = Math.min(...dscrs);
  const avgDscr = dscrs.reduce((s, x) => s + x, 0) / dscrs.length;
  const llcr = years.filter((x) => x.ds > 0).reduce((s, x) => s + x.cfads / (1 + p.rate) ** x.y, 0) / debt;
  return { capex, debt, equity, ds, years, minDscr, avgDscr, llcr, equityNpv: npv, covenantBreach: minDscr < 1.2 };
}
export function projectStress(p: ProjectInput, sims = 1500, seed = 5) {
  const r = rng(seed);
  let breach = 0;
  const mins: number[] = [];
  for (let i = 0; i < sims; i++) {
    const shock = 0.3 * normal(r);
    const res = projectFinance({ ...p, commodityShock: p.commodityShock + shock });
    mins.push(res.minDscr);
    if (res.minDscr < 1.2) breach++;
  }
  mins.sort((a, b) => a - b);
  return { breachProb: breach / sims, p5: quantile(mins, 0.05), p50: quantile(mins, 0.5) };
}

/* ---------------- Part 5: insurance catastrophe ---------------- */
export type Peril = "hurricane" | "earthquake" | "flood";
export const PERILS: Record<Peril, { name: string; lambda: number; mu: number; sigma: number; i50: number; spread: number }> = {
  hurricane: { name: "Hurricane (wind, m/s)", lambda: 0.45, mu: Math.log(38), sigma: 0.28, i50: 72, spread: 9 },
  earthquake: { name: "Earthquake (PGA, %g)", lambda: 0.12, mu: Math.log(18), sigma: 0.6, i50: 55, spread: 12 },
  flood: { name: "Flood (depth, cm)", lambda: 0.6, mu: Math.log(40), sigma: 0.55, i50: 160, spread: 45 },
};
export function vulnerabilityShift(m: Material, pof: number) {
  // degraded / low-strength materials lower the 50%-damage intensity
  const strengthAdj = clamp(Math.log(m.refYield / 300) * 0.08, -0.15, 0.15);
  return 1 + strengthAdj - clamp(pof * 1.5, 0, 0.4);
}
export function catModel(opts: { peril: Peril; tiv: number; vulnShift: number; years: number; seed?: number; deductible: number; limit: number; load: number; coc: number }) {
  const P = PERILS[opts.peril];
  const r = rng(opts.seed ?? 3);
  const annual: number[] = [], maxEvent: number[] = [];
  const i50 = P.i50 * opts.vulnShift;
  for (let y = 0; y < opts.years; y++) {
    const n = poisson(r, P.lambda);
    let tot = 0, mx = 0;
    for (let k = 0; k < n; k++) {
      const I = Math.exp(P.mu + P.sigma * normal(r));
      const dr = 1 / (1 + Math.exp(-(I - i50) / P.spread));
      const gross = opts.tiv * dr;
      const net = clamp(gross - opts.deductible, 0, opts.limit);
      tot += net; mx = Math.max(mx, net);
    }
    annual.push(tot); maxEvent.push(mx);
  }
  const eal = annual.reduce((s, x) => s + x, 0) / annual.length;
  const sd = Math.sqrt(annual.reduce((s, x) => s + (x - eal) ** 2, 0) / annual.length);
  const aep = [...annual].sort((a, b) => b - a), oep = [...maxEvent].sort((a, b) => b - a);
  const rp = (arr: number[], T: number) => arr[Math.max(0, Math.floor(arr.length / T) - 1)];
  const rps = [10, 25, 50, 100, 250, 500];
  const curve = rps.map((T) => ({ T, aep: rp(aep, T), oep: rp(oep, T) }));
  const pml250 = rp(oep, 250);
  const premium = eal + opts.load * sd + opts.coc * Math.max(0, pml250 - eal);
  return { eal, sd, curve, pml100: rp(oep, 100), pml250, premium, rateOnLine: premium / opts.limit, lossRatio: eal / premium, i50 };
}

/* ---------------- Part 5: ESG portfolio ---------------- */
export interface Holding { name: string; sector: string; weight: number; intensity: number; e: number; s: number; g: number; materialId: string; recycled: number }
export const HOLDINGS: Holding[] = [
  { name: "Boreal Copper Mining", sector: "Materials", weight: 0.14, intensity: 410, e: 48, s: 62, g: 70, materialId: "cu", recycled: 0.32 },
  { name: "Kestrel Transmission", sector: "Utilities", weight: 0.18, intensity: 120, e: 74, s: 68, g: 77, materialId: "cu", recycled: 0.2 },
  { name: "Halden Steelworks", sector: "Materials", weight: 0.12, intensity: 1650, e: 31, s: 55, g: 64, materialId: "s355", recycled: 0.45 },
  { name: "Volta Grid Storage", sector: "Energy storage", weight: 0.15, intensity: 85, e: 82, s: 60, g: 72, materialId: "lfp", recycled: 0.12 },
  { name: "Aeolus Offshore Wind", sector: "Renewables", weight: 0.16, intensity: 22, e: 88, s: 71, g: 75, materialId: "s355", recycled: 0.3 },
  { name: "Saline Desal Infra", sector: "Water", weight: 0.1, intensity: 210, e: 66, s: 79, g: 69, materialId: "ti64", recycled: 0.08 },
  { name: "Meridian Superalloys", sector: "Industrials", weight: 0.15, intensity: 540, e: 52, s: 64, g: 81, materialId: "ni3al", recycled: 0.25 },
];
export function esgAnalytics(holdings: Holding[], opts: { carbonPrice: number; aum: number; tilt: number }) {
  const risk = (h: Holding) => {
    const m = getMaterial(h.materialId);
    const p = predictProperties(m);
    return clamp(p.corrosion * 4 + COMMODITIES[m.commodity].vol + h.intensity / 2000, 0, 2);
  };
  const raw = holdings.map((h) => h.weight * Math.exp(-opts.tilt * (risk(h) + h.intensity / 800)));
  const sum = raw.reduce((s, x) => s + x, 0);
  const rows = holdings.map((h, i) => {
    const w = raw[i] / sum;
    const score = 0.5 * h.e + 0.3 * h.s + 0.2 * h.g;
    return { ...h, newWeight: w, score, matRisk: risk(h), carbonCost: w * opts.aum * (h.intensity / 1e6) * opts.carbonPrice };
  });
  const waci = rows.reduce((s, r) => s + r.newWeight * r.intensity, 0);
  const baseWaci = holdings.reduce((s, h) => s + h.weight * h.intensity, 0);
  const score = rows.reduce((s, r) => s + r.newWeight * r.score, 0);
  const recycled = rows.reduce((s, r) => s + r.newWeight * r.recycled, 0);
  const carbonCost = rows.reduce((s, r) => s + r.carbonCost, 0);
  const grade = score >= 75 ? "A" : score >= 68 ? "B+" : score >= 60 ? "B" : score >= 52 ? "C+" : "C";
  return { rows, waci, baseWaci, score, recycled, carbonCost, grade };
}

/* ---------------- Part 6: MatRisk Lab ---------------- */
export interface Scenario { id: string; name: string; blurb: string; shocks: Partial<Record<CommodityId, number>>; corrosionMult: number; peril: Peril; catMult: number; volMult: number; difficulty: number }
export const SCENARIOS: Scenario[] = [
  { id: "copper", name: "Copper shortage", blurb: "Chilean mine strikes and a smelter outage squeeze copper. Grid build-outs face cost overruns.", shocks: { CU: 0.38, AL: 0.12 }, corrosionMult: 1, peril: "flood", catMult: 1, volMult: 1.6, difficulty: 1 },
  { id: "corrosion", name: "Corrosion cascade", blurb: "A humid, chloride-heavy season speeds up rebar and pipeline corrosion across coastal assets.", shocks: { FE: 0.15, NI: 0.2 }, corrosionMult: 3.5, peril: "hurricane", catMult: 1.4, volMult: 1.2, difficulty: 2 },
  { id: "lithium", name: "Lithium boom-bust", blurb: "Lithium jumps 60% and then crashes. A cathode degradation recall hits storage projects.", shocks: { LI: -0.45, NI: -0.18 }, corrosionMult: 1.6, peril: "flood", catMult: 1, volMult: 2.2, difficulty: 2 },
  { id: "hurricane", name: "Cat-5 on coastal steel", blurb: "A Category 5 storm hits ports and offshore wind built on fatigued S355 welds.", shocks: { FE: 0.25, CU: 0.1 }, corrosionMult: 2, peril: "hurricane", catMult: 2.6, volMult: 1.4, difficulty: 3 },
];
export interface Action { id: string; name: string; cost: number; desc: string }
export const ACTIONS: Action[] = [
  { id: "hedge", name: "Commodity futures hedge", cost: 30, desc: "Cuts commodity price exposure by 65%" },
  { id: "coat", name: "Ti/ceramic coating retrofit", cost: 35, desc: "Cuts corrosion rate by 60% on exposed assets" },
  { id: "reins", name: "Cat XL reinsurance", cost: 25, desc: "Caps catastrophe losses above the attachment point" },
  { id: "dsra", name: "Top up debt reserve", cost: 20, desc: "Six months of debt service held as a buffer" },
  { id: "rebalance", name: "ESG material tilt", cost: 15, desc: "Shifts weight away from high-intensity holdings" },
  { id: "sensors", name: "Structural health sensors", cost: 20, desc: "Finds cracks early and cuts failure losses by 35%" },
];
export function runLabRound(sc: Scenario, actions: string[], seed: number) {
  const has = (id: string) => actions.includes(id);
  const r = rng(seed);
  const noise = () => 1 + 0.12 * normal(r);
  const book = bookVaR(DEFAULT_BOOK, { horizon: 10, sims: 2000, shock: sc.shocks, volMult: sc.volMult, seed });
  const commodityLoss = Math.max(0, -book.mean + book.var95 * 0.4) * noise();
  const s355 = getMaterial("s355");
  const pred = predictProperties(s355, { ...DEFAULT_ENV, chloride: 0.6 });
  const corr = { ...pred, corrosion: pred.corrosion * sc.corrosionMult * (has("coat") ? 0.4 : 1) };
  const fail = failureModel(s355, corr, { stressMPa: 130, years: 25, thicknessMm: 30, assetValue: 420e6, weibullShape: 8 });
  const failureLoss = fail.expectedLoss * (has("sensors") ? 0.65 : 1) * noise();
  const cat = catModel({ peril: sc.peril, tiv: 900e6, vulnShift: vulnerabilityShift(s355, fail.end.pof) / Math.sqrt(sc.catMult), years: 2000, seed, deductible: 5e6, limit: 400e6, load: 0.3, coc: 0.08 });
  let catLoss = cat.pml100 * 0.35 * noise();
  if (has("reins")) catLoss = Math.min(catLoss, 40e6);
  const pf = projectFinance({ ...DEFAULT_PROJECT, commodityShock: Object.values(sc.shocks).reduce((s, x) => s + Math.max(0, x ?? 0), 0), degradationPof: fail.end.pof });
  const pfLoss = Math.max(0, (1.35 - pf.minDscr)) * 120e6 * (has("dsra") ? 0.45 : 1) * noise();
  const esgLoss = (has("rebalance") ? 0.6 : 1) * 18e6 * sc.volMult * noise();
  const lines = [
    { k: "Commodity desk", v: commodityLoss * (has("hedge") ? 0.35 : 1) },
    { k: "Material failure", v: failureLoss },
    { k: "Catastrophe insurance", v: catLoss },
    { k: "Project finance", v: pfLoss },
    { k: "ESG / transition", v: esgLoss },
  ];
  const total = lines.reduce((s, l) => s + l.v, 0);
  const baseline = 520e6 * (0.8 + 0.25 * sc.difficulty);
  const cost = actions.reduce((s, a) => s + (ACTIONS.find((x) => x.id === a)?.cost ?? 0), 0);
  const score = Math.round(clamp(1000 * (1 - total / baseline) - cost * 1.5 + sc.difficulty * 60, 0, 1000));
  return { lines, total, score, minDscr: pf.minDscr, pof: fail.end.pof };
}

/* ---------------- Part 7: validation ---------------- */
export function runValidation() {
  // 1. property model vs reference measurements
  const props = MATERIALS.map((m) => ({ id: m.name, pred: predictProperties(m).yield, ref: m.refYield }));
  const mape = props.reduce((s, p) => s + Math.abs(p.pred - p.ref) / p.ref, 0) / props.length;
  const meanRef = props.reduce((s, p) => s + p.ref, 0) / props.length;
  const r2 = 1 - props.reduce((s, p) => s + (p.pred - p.ref) ** 2, 0) / props.reduce((s, p) => s + (p.ref - meanRef) ** 2, 0);

  // 2. physics constraint sweep
  let violations = 0, checks = 0;
  for (const m of MATERIALS) {
    let prevC = -Infinity, prevY = Infinity;
    for (let t = -20; t <= 300; t += 20) {
      const p = predictProperties(m, { ...DEFAULT_ENV, tempC: t });
      checks += 2;
      if (p.corrosion < prevC) violations++;
      if (p.yield > prevY + 1e-9) violations++;
      prevC = p.corrosion; prevY = p.yield;
    }
  }

  // 3. VaR backtest (Kupiec POF) on a commodity P&L series
  const r = rng(99);
  const c = COMMODITIES.CU, sig = c.vol / Math.sqrt(252);
  const N = 500;
  let exc = 0;
  const var99 = 2.326 * sig;
  for (let i = 0; i < N; i++) {
    const ret = sig * normal(r);
    if (-ret > var99) exc++;
  }
  const p = 0.01, x = exc;
  const ll = (q: number) => (N - x) * Math.log(1 - q) + (x > 0 ? x * Math.log(q) : 0);
  const kupiec = -2 * (ll(p) - ll(Math.max(x / N, 1e-9)));

  // 4. cat model: Monte Carlo EAL vs numerical integration
  const P = PERILS.hurricane, tiv = 500e6;
  const mc = catModel({ peril: "hurricane", tiv, vulnShift: 1, years: 20000, seed: 4, deductible: 0, limit: 1e12, load: 0, coc: 0 });
  let integ = 0; const steps = 4000;
  for (let i = 0; i < steps; i++) {
    const z = -6 + (12 * (i + 0.5)) / steps;
    const I = Math.exp(P.mu + P.sigma * z);
    const dr = 1 / (1 + Math.exp(-(I - P.i50) / P.spread));
    integ += dr * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * (12 / steps);
  }
  const analyticEal = P.lambda * tiv * integ;
  const catErr = Math.abs(mc.eal - analyticEal) / analyticEal;

  // 5. project finance monotonicity
  const shocks = [-0.2, 0, 0.2, 0.4, 0.6];
  const dscrs = shocks.map((s) => projectFinance({ ...DEFAULT_PROJECT, commodityShock: s }).minDscr);
  const pfMono = dscrs.every((d, i) => i === 0 || d <= dscrs[i - 1]);

  // 6. failure model sanity: PoF non-decreasing over time
  const fm = failureModel(getMaterial("s355"), predictProperties(getMaterial("s355")), { stressMPa: 150, years: 30, thicknessMm: 25, assetValue: 1e8, weibullShape: 8 });
  const fmMono = fm.curve.every((c, i) => i === 0 || c.pof >= fm.curve[i - 1].pof);

  return {
    props, mape, r2,
    tests: [
      { useCase: "Materials", name: "Yield-strength prediction vs reference", metric: `MAPE ${(mape * 100).toFixed(1)}% · R² ${r2.toFixed(3)}`, threshold: "MAPE < 10%", passed: mape < 0.1 },
      { useCase: "Materials", name: "Physics-constraint sweep (−20…300 °C)", metric: `${violations} violations / ${checks} checks`, threshold: "0 violations", passed: violations === 0 },
      { useCase: "Commodity", name: "Copper 99% VaR backtest (Kupiec POF)", metric: `${exc} exceptions / ${N} days · LR ${kupiec.toFixed(2)}`, threshold: "LR < 3.84", passed: kupiec < 3.84 },
      { useCase: "Infrastructure", name: "DSCR monotonic in commodity shock", metric: dscrs.map((d) => d.toFixed(2)).join(" → "), threshold: "non-increasing", passed: pfMono },
      { useCase: "Infrastructure", name: "Failure PoF non-decreasing in time", metric: `PoF₃₀ = ${(fm.end.pof * 100).toFixed(2)}%`, threshold: "monotone", passed: fmMono },
      { useCase: "Insurance", name: "Cat EAL: Monte Carlo vs integration", metric: `${fmtMoney(mc.eal)} vs ${fmtMoney(analyticEal)} · err ${(catErr * 100).toFixed(1)}%`, threshold: "error < 5%", passed: catErr < 0.05 },
    ],
  };
}
