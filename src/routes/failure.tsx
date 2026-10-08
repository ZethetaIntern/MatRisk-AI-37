import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Eyebrow, LineChart, PageHeader, Panel, Select, Slider, Stat } from "@/components/matrisk/ui";
import { DEFAULT_ENV, failureModel, fmtMoney, getMaterial, MATERIALS, predictProperties } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/failure")({
  head: () => seo("Material failure & degradation risk", "Weibull failure probability, corrosion section loss and fatigue life, turned into expected financial loss."),
  component: Failure,
});

function Failure() {
  const [id, setId] = useState("s355");
  const [chloride, setChloride] = useState(0.5);
  const [stress, setStress] = useState(140);
  const [years, setYears] = useState(30);
  const [thick, setThick] = useState(25);
  const [value, setValue] = useState(250);
  const [shape, setShape] = useState(8);
  const m = getMaterial(id);
  const p = useMemo(() => predictProperties(m, { ...DEFAULT_ENV, chloride }), [m, chloride]);
  const f = useMemo(() => failureModel(m, p, { stressMPa: stress, years, thicknessMm: thick, assetValue: value * 1e6, weibullShape: shape }), [m, p, stress, years, thick, value, shape]);
  const ranking = useMemo(() => MATERIALS.map((x) => {
    const px = predictProperties(x, { ...DEFAULT_ENV, chloride });
    const fx = failureModel(x, px, { stressMPa: stress, years, thicknessMm: thick, assetValue: value * 1e6, weibullShape: shape });
    return { x, fx };
  }).sort((a, b) => b.fx.expectedLoss - a.fx.expectedLoss), [chloride, stress, years, thick, value, shape]);

  return (
    <div className="space-y-4">
      <PageHeader part="Part 3 · Failure risk" title={<>Degradation into <span className="text-gradient">expected loss</span></>} desc="Corrosion thins the load-bearing section, so stress rises over time. A Weibull strength model gives the probability of failure each year, and that probability is multiplied by asset value.">
        <div className="w-60"><Select label="Material" value={id} onChange={setId} options={MATERIALS.map((x) => ({ value: x.id, label: x.name }))} /></div>
      </PageHeader>
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 space-y-5 md:col-span-4">
          <Eyebrow>Asset & loading</Eyebrow>
          <Slider label="Applied stress" value={stress} min={20} max={600} step={5} onChange={setStress} format={(v) => `${v} MPa`} />
          <Slider label="Section thickness" value={thick} min={2} max={60} step={1} onChange={setThick} format={(v) => `${v} mm`} />
          <Slider label="Chloride exposure" value={chloride} min={0} max={1} step={0.05} onChange={setChloride} format={(v) => `${(v * 100).toFixed(0)}%`} />
          <Slider label="Horizon" value={years} min={5} max={60} step={1} onChange={setYears} format={(v) => `${v} yrs`} />
          <Slider label="Asset value" value={value} min={10} max={2000} step={10} onChange={setValue} format={(v) => `$${v}M`} />
          <Slider label="Weibull shape β" value={shape} min={2} max={20} step={1} onChange={setShape} />
        </Panel>
        <div className="col-span-12 space-y-4 md:col-span-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label={`PoF at ${years}y`} value={`${(f.end.pof * 100).toFixed(2)}%`} tone={f.rating === "HIGH" ? "danger" : f.rating === "MEDIUM" ? "warn" : "ok"} />
            <Stat label="Expected loss" value={fmtMoney(f.expectedLoss)} tone="brand" />
            <Stat label="Years to 10% PoF" value={f.remainingLife ?? `>${years}`} tone="teal" />
            <Stat label="Fatigue life" value={f.fatigueCycles > 1e12 ? "∞" : f.fatigueCycles.toExponential(1)} sub="cycles" tone="violet" />
          </div>
          <Panel>
            <div className="flex items-center justify-between"><Eyebrow>Probability of failure over time</Eyebrow><Badge tone={f.rating === "HIGH" ? "danger" : f.rating === "MEDIUM" ? "warn" : "ok"}>{f.rating}</Badge></div>
            <div className="mt-4"><LineChart series={[{ values: f.curve.map((c) => c.pof), className: "stroke-teal" }]} height={170} xLabels={["year 0", `year ${years}`]} /></div>
          </Panel>
          <Panel>
            <Eyebrow>Remaining thickness (mm) vs effective stress (MPa)</Eyebrow>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <LineChart series={[{ values: f.curve.map((c) => c.thickness), className: "stroke-brand" }]} height={110} xLabels={["thickness", `${f.end.thickness.toFixed(1)} mm`]} />
              <LineChart series={[{ values: f.curve.map((c) => c.stress), className: "stroke-violet" }]} height={110} refLine={{ y: p.yield, label: `yield ${p.yield.toFixed(0)}` }} xLabels={["stress", `${f.end.stress.toFixed(0)} MPa`]} />
            </div>
          </Panel>
        </div>
        <Panel className="col-span-12">
          <Eyebrow>Degradation risk ranking · same loading, all materials</Eyebrow>
          <div className="mt-3 divide-y divide-border">
            {ranking.map(({ x, fx }) => (
              <div key={x.id} className="flex items-center gap-4 py-2.5 text-sm">
                <span className="w-44 font-mono text-xs">{x.name}</span>
                <span className="flex-1 truncate text-muted-foreground">{x.use}</span>
                <span className="w-20 text-right font-mono text-xs">{(fx.end.pof * 100).toFixed(2)}%</span>
                <span className="w-24 text-right font-mono">{fmtMoney(fx.expectedLoss)}</span>
                <span className="w-20 text-right"><Badge tone={fx.rating === "HIGH" ? "danger" : fx.rating === "MEDIUM" ? "warn" : "ok"}>{fx.rating}</Badge></span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
