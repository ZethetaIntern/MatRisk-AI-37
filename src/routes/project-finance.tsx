import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Eyebrow, LineChart, PageHeader, Panel, Select, Slider, Stat } from "@/components/matrisk/ui";
import { DEFAULT_ENV, DEFAULT_PROJECT, failureModel, fmtMoney, getMaterial, pct, predictProperties, projectFinance, projectStress } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/project-finance")({
  head: () => seo("Infrastructure project finance", "DSCR, LLCR and covenant breach probability for infrastructure, linked to commodity capex and material degradation."),
  component: ProjectFinance,
});

const ASSETS = [
  { value: "s355", label: "Offshore wind farm · S355 towers" },
  { value: "ss316", label: "Coastal bridge · 316L rebar" },
  { value: "cu", label: "HV transmission line · Cu conductor" },
  { value: "lfp", label: "Grid battery park · LiFePO₄" },
];

function ProjectFinance() {
  const [asset, setAsset] = useState("s355");
  const [shock, setShock] = useState(0);
  const [debtPct, setDebtPct] = useState(0.7);
  const [rate, setRate] = useState(0.075);
  const [chloride, setChloride] = useState(0.4);
  const [revenue, setRevenue] = useState(128);
  const m = getMaterial(asset);
  const pof = useMemo(() => {
    const p = predictProperties(m, { ...DEFAULT_ENV, chloride });
    return failureModel(m, p, { stressMPa: 0.42 * p.yield, years: 25, thicknessMm: 25, assetValue: 1, weibullShape: 8 }).end.pof;
  }, [m, chloride]);
  const input = { ...DEFAULT_PROJECT, commodityShock: shock, debtPct, rate, revenue: revenue * 1e6, degradationPof: pof };
  const r = useMemo(() => projectFinance(input), [shock, debtPct, rate, revenue, pof]);
  const st = useMemo(() => projectStress(input), [shock, debtPct, rate, revenue, pof]);
  const ds = r.years.filter((y) => y.ds > 0);

  return (
    <div className="space-y-4">
      <PageHeader part="Part 4 · Project finance" title={<>Covenants under <span className="text-gradient">material stress</span></>} desc="Commodity prices change construction cost. Material degradation probability raises maintenance capex. Both flow into cash available for debt service.">
        <div className="w-72"><Select label="Asset" value={asset} onChange={setAsset} options={ASSETS} /></div>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Total capex" value={fmtMoney(r.capex)} />
        <Stat label="Min DSCR" value={`${r.minDscr.toFixed(2)}×`} tone={r.covenantBreach ? "danger" : "ok"} sub="covenant 1.20×" />
        <Stat label="LLCR" value={`${r.llcr.toFixed(2)}×`} tone="brand" />
        <Stat label="Equity NPV @10%" value={fmtMoney(r.equityNpv)} tone={r.equityNpv >= 0 ? "teal" : "danger"} />
        <Stat label="Breach probability" value={`${(st.breachProb * 100).toFixed(1)}%`} tone="violet" sub={`P5 DSCR ${st.p5.toFixed(2)}×`} />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 space-y-5 md:col-span-4">
          <Eyebrow>Drivers</Eyebrow>
          <Slider label="Commodity capex shock" value={shock} min={-0.4} max={1} step={0.05} onChange={setShock} format={(v) => pct(v, 0)} />
          <Slider label="Chloride exposure (degradation)" value={chloride} min={0} max={1} step={0.05} onChange={setChloride} format={(v) => `${(v * 100).toFixed(0)}%`} />
          <Slider label="Gearing" value={debtPct} min={0.4} max={0.85} step={0.01} onChange={setDebtPct} format={(v) => `${(v * 100).toFixed(0)}%`} />
          <Slider label="Interest rate" value={rate} min={0.03} max={0.12} step={0.0025} onChange={setRate} format={(v) => `${(v * 100).toFixed(2)}%`} />
          <Slider label="Year-1 revenue" value={revenue} min={60} max={220} step={2} onChange={setRevenue} format={(v) => `$${v}M`} />
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">{m.name} 25-yr PoF: <span className="text-brand">{(pof * 100).toFixed(2)}%</span> → maintenance uplift ×{(1 + 6 * pof).toFixed(2)}</div>
        </Panel>
        <Panel className="col-span-12 md:col-span-8">
          <div className="flex items-center justify-between"><Eyebrow>DSCR profile by year</Eyebrow>{r.covenantBreach ? <Badge tone="danger">Covenant breach</Badge> : <Badge tone="ok">Within covenant</Badge>}</div>
          <div className="mt-4"><LineChart series={[{ values: ds.map((y) => y.dscr), className: "stroke-teal" }]} height={180} refLine={{ y: 1.2, label: "1.20× lock-up" }} xLabels={["year 1", `year ${ds.length}`]} /></div>
          <Eyebrow className="mt-6">CFADS vs debt service</Eyebrow>
          <div className="mt-3"><LineChart series={[{ values: ds.map((y) => y.cfads), className: "stroke-brand" }, { values: ds.map((y) => y.ds), className: "stroke-violet", dashed: true }]} height={120} xLabels={["— CFADS", "- - debt service"]} /></div>
        </Panel>
      </div>
    </div>
  );
}
