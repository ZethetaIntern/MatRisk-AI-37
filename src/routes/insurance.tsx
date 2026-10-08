import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eyebrow, LineChart, PageHeader, Panel, Select, Slider, Stat } from "@/components/matrisk/ui";
import { catModel, DEFAULT_ENV, failureModel, fmtMoney, getMaterial, MATERIALS, PERILS, predictProperties, vulnerabilityShift, type Peril } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/insurance")({
  head: () => seo("Insurance catastrophe pricing", "Stochastic cat model with material-aware vulnerability curves: EAL, PML, exceedance curves and technical premium."),
  component: Insurance,
});

function Insurance() {
  const [peril, setPeril] = useState<Peril>("hurricane");
  const [mat, setMat] = useState("s355");
  const [tiv, setTiv] = useState(600);
  const [ded, setDed] = useState(5);
  const [limit, setLimit] = useState(300);
  const [age, setAge] = useState(15);
  const [load, setLoad] = useState(0.3);
  const m = getMaterial(mat);
  const pof = useMemo(() => {
    const p = predictProperties(m, { ...DEFAULT_ENV, chloride: 0.5 });
    return failureModel(m, p, { stressMPa: 0.4 * p.yield, years: age, thicknessMm: 20, assetValue: 1, weibullShape: 8 }).end.pof;
  }, [m, age]);
  const shift = vulnerabilityShift(m, pof);
  const c = useMemo(() => catModel({ peril, tiv: tiv * 1e6, vulnShift: shift, years: 10000, deductible: ded * 1e6, limit: limit * 1e6, load, coc: 0.08 }), [peril, tiv, shift, ded, limit, load]);
  const fresh = useMemo(() => catModel({ peril, tiv: tiv * 1e6, vulnShift: vulnerabilityShift(m, 0), years: 10000, deductible: ded * 1e6, limit: limit * 1e6, load, coc: 0.08 }), [peril, tiv, m, ded, limit, load]);
  const P = PERILS[peril];
  const vuln = Array.from({ length: 40 }, (_, i) => {
    const I = P.i50 * 0.2 + (P.i50 * 1.8 * i) / 39;
    return { I, aged: 1 / (1 + Math.exp(-(I - c.i50) / P.spread)), fresh: 1 / (1 + Math.exp(-(I - fresh.i50) / P.spread)) };
  });

  return (
    <div className="space-y-4">
      <PageHeader part="Part 5 · Insurance cat" title={<>Catastrophe pricing with <span className="text-gradient">material vulnerability</span></>} desc="Poisson event frequency, lognormal hazard intensity and a logistic damage curve over 10,000 simulated years. Corrosion and fatigue lower the intensity at which an asset reaches 50% damage." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="EAL" value={fmtMoney(c.eal)} tone="brand" sub={`fresh asset ${fmtMoney(fresh.eal)}`} />
        <Stat label="PML 1-in-100" value={fmtMoney(c.pml100)} tone="violet" />
        <Stat label="PML 1-in-250" value={fmtMoney(c.pml250)} tone="danger" />
        <Stat label="Technical premium" value={fmtMoney(c.premium)} tone="teal" />
        <Stat label="Rate on line" value={`${(c.rateOnLine * 100).toFixed(2)}%`} sub={`loss ratio ${(c.lossRatio * 100).toFixed(0)}%`} />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 space-y-5 md:col-span-4">
          <Select label="Peril" value={peril} onChange={setPeril} options={(Object.keys(PERILS) as Peril[]).map((k) => ({ value: k, label: PERILS[k].name }))} />
          <Select label="Construction material" value={mat} onChange={setMat} options={MATERIALS.map((x) => ({ value: x.id, label: x.name }))} />
          <Slider label="Asset age" value={age} min={0} max={50} step={1} onChange={setAge} format={(v) => `${v} yrs`} />
          <Slider label="Total insured value" value={tiv} min={50} max={3000} step={50} onChange={setTiv} format={(v) => `$${v}M`} />
          <Slider label="Deductible" value={ded} min={0} max={50} step={1} onChange={setDed} format={(v) => `$${v}M`} />
          <Slider label="Limit" value={limit} min={25} max={2000} step={25} onChange={setLimit} format={(v) => `$${v}M`} />
          <Slider label="Volatility load" value={load} min={0} max={1} step={0.05} onChange={setLoad} format={(v) => `${(v * 100).toFixed(0)}% σ`} />
        </Panel>
        <div className="col-span-12 space-y-4 md:col-span-8">
          <Panel>
            <Eyebrow>Exceedance curves · OEP (solid) vs AEP (dashed)</Eyebrow>
            <div className="mt-4"><LineChart series={[{ values: c.curve.map((x) => x.oep), className: "stroke-brand" }, { values: c.curve.map((x) => x.aep), className: "stroke-teal", dashed: true }]} height={160} xLabels={["1-in-10", "1-in-500"]} /></div>
            <div className="mt-3 grid grid-cols-6 gap-2 text-center font-mono text-[11px]">
              {c.curve.map((x) => <div key={x.T} className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">{x.T}y</div><div>{fmtMoney(x.oep)}</div></div>)}
            </div>
          </Panel>
          <Panel>
            <Eyebrow>Vulnerability curve · aged (violet) vs new (dashed)</Eyebrow>
            <div className="mt-4"><LineChart series={[{ values: vuln.map((v) => v.aged), className: "stroke-violet" }, { values: vuln.map((v) => v.fresh), className: "stroke-brand", dashed: true }]} height={130} xLabels={[`${vuln[0].I.toFixed(0)}`, `${vuln[vuln.length - 1].I.toFixed(0)} intensity`]} /></div>
            <p className="mt-2 text-xs text-muted-foreground">50% damage intensity moves from {fresh.i50.toFixed(1)} to {c.i50.toFixed(1)} because of {age}-year degradation (PoF {(pof * 100).toFixed(2)}%).</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
