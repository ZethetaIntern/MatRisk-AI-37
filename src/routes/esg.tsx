import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eyebrow, Meter, PageHeader, Panel, Slider, Stat } from "@/components/matrisk/ui";
import { esgAnalytics, fmtMoney, getMaterial, HOLDINGS } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/esg")({
  head: () => seo("ESG portfolio analytics", "Carbon intensity, ESG scores, recycled content and a material-risk-aware portfolio tilt."),
  component: Esg,
});

function Esg() {
  const [carbon, setCarbon] = useState(85);
  const [aum, setAum] = useState(2);
  const [tilt, setTilt] = useState(0);
  const base = useMemo(() => esgAnalytics(HOLDINGS, { carbonPrice: carbon, aum: aum * 1e9, tilt: 0 }), [carbon, aum]);
  const r = useMemo(() => esgAnalytics(HOLDINGS, { carbonPrice: carbon, aum: aum * 1e9, tilt }), [carbon, aum, tilt]);

  return (
    <div className="space-y-4">
      <PageHeader part="Part 5 · ESG analytics" title={<>Portfolio ESG with <span className="text-gradient">material lens</span></>} desc="Each holding is linked to its main engineering material. Corrosion, commodity volatility and carbon intensity combine into a material-risk score that drives an optional tilt." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="ESG grade" value={r.grade} tone="teal" big sub={`score ${r.score.toFixed(1)} (was ${base.score.toFixed(1)})`} />
        <Stat label="WACI" value={r.waci.toFixed(0)} sub={`tCO₂e/$M · base ${r.baseWaci.toFixed(0)}`} tone="brand" />
        <Stat label="Carbon cost" value={fmtMoney(r.carbonCost)} sub={`at $${carbon}/t`} tone="danger" />
        <Stat label="Recycled content" value={`${(r.recycled * 100).toFixed(1)}%`} tone="violet" />
        <Stat label="Intensity cut" value={`${((1 - r.waci / r.baseWaci) * 100).toFixed(1)}%`} tone="ok" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 space-y-5 md:col-span-4">
          <Eyebrow>Controls</Eyebrow>
          <Slider label="Carbon price" value={carbon} min={0} max={300} step={5} onChange={setCarbon} format={(v) => `$${v}/t`} />
          <Slider label="Portfolio AUM" value={aum} min={0.1} max={20} step={0.1} onChange={setAum} format={(v) => `$${v.toFixed(1)}B`} />
          <Slider label="Material-risk tilt strength" value={tilt} min={0} max={3} step={0.1} onChange={setTilt} format={(v) => v.toFixed(1)} />
          <p className="text-xs text-muted-foreground">Tilt reweights each holding by w·exp(−k·(material risk + intensity/800)), then normalises.</p>
        </Panel>
        <Panel className="col-span-12 md:col-span-8">
          <Eyebrow>Holdings</Eyebrow>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-normal">Holding</th><th className="font-normal">Material</th><th className="text-right font-normal">Weight</th><th className="text-right font-normal">tCO₂e/$M</th><th className="w-28 font-normal">ESG</th><th className="text-right font-normal">Mat. risk</th></tr></thead>
              <tbody className="divide-y divide-border">
                {r.rows.map((h) => (
                  <tr key={h.name}>
                    <td className="py-2.5">{h.name}<div className="text-xs text-muted-foreground">{h.sector}</div></td>
                    <td className="font-mono text-xs text-muted-foreground">{getMaterial(h.materialId).name}</td>
                    <td className="text-right font-mono text-xs">{(h.newWeight * 100).toFixed(1)}%{tilt > 0 && <div className={h.newWeight >= h.weight ? "text-ok" : "text-danger"}>{h.newWeight >= h.weight ? "+" : ""}{((h.newWeight - h.weight) * 100).toFixed(1)}</div>}</td>
                    <td className="text-right font-mono text-xs">{h.intensity}</td>
                    <td className="px-3"><Meter value={h.score / 100} /><div className="mt-1 font-mono text-[10px] text-muted-foreground">{h.score.toFixed(0)}</div></td>
                    <td className="text-right font-mono text-xs">{h.matRisk.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
