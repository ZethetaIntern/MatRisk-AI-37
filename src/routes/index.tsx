import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bars, Eyebrow, Panel } from "@/components/matrisk/ui";
import { catModel, encodeCrystal, failureModel, getMaterial, MATERIALS, predictProperties, runLabRound, runValidation, SCENARIOS, vulnerabilityShift } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Overview", "MatRisk AI links crystal structures, material failure and degradation to commodity, project finance, insurance and ESG risk."),
  component: Overview,
});

const CELL = ["bg-brand/25 outline-brand/40", "bg-teal/25 outline-teal/40", "bg-violet/25 outline-violet/40", "bg-brand/15 outline-glass-border"];

function Overview() {
  const d = useMemo(() => {
    const v = runValidation();
    const passRate = v.tests.filter((t) => t.passed).length / v.tests.length;
    const m = getMaterial("s355");
    const p = predictProperties(m);
    const f = failureModel(m, p, { stressMPa: 150, years: 30, thicknessMm: 25, assetValue: 1e8, weibullShape: 8 });
    const enc = encodeCrystal(getMaterial("lfp"));
    const loss = MATERIALS.filter((x) => ["s355", "ss316", "lfp"].includes(x.id)).map((x) => {
      const px = predictProperties(x);
      const fx = failureModel(x, px, { stressMPa: 0.4 * px.yield, years: 25, thicknessMm: 20, assetValue: 1e8, weibullShape: 8 });
      const c = catModel({ peril: "hurricane", tiv: 300e6, vulnShift: vulnerabilityShift(x, fx.end.pof), years: 4000, deductible: 2e6, limit: 200e6, load: 0.3, coc: 0.08 });
      return { name: x.name, rate: c.premium / 200e6 };
    });
    const lab = runLabRound(SCENARIOS[0], [], 42);
    return { v, passRate, p, f, enc, loss, lab };
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12 p-8 md:col-span-8">
        <span className="inline-block rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand">Dual-domain intelligence</span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
          Where crystal lattices<br />meet <span className="text-gradient">capital risk</span>.
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          MatRisk AI encodes material microstructure and predicts properties within physical limits. It then feeds degradation risk into commodity desks, project finance and catastrophe pricing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/lab" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Enter the Lab</Link>
          <Link to="/docs" className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">View architecture</Link>
        </div>
      </Panel>

      <Panel className="col-span-12 md:col-span-4">
        <Eyebrow>System validation</Eyebrow>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-display text-5xl font-bold">{(100 - d.v.mape * 100).toFixed(1)}</span>
          <span className="mb-2 text-teal">%</span>
        </div>
        <p className="text-xs text-muted-foreground">Property accuracy against reference data. {d.v.tests.filter((t) => t.passed).length}/{d.v.tests.length} validation tests pass across commodity, infrastructure and insurance use cases.</p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-brand" style={{ width: `${d.passRate * 100}%` }} /></div>
        <Link to="/validation" className="mt-4 inline-block text-xs text-brand hover:underline">Open validation report →</Link>
      </Panel>

      <Link to="/materials" className="col-span-12 md:col-span-4"><Panel className="h-full transition-colors hover:border-brand/40">
        <Eyebrow>Crystal structure encoding</Eyebrow>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {d.enc.embedding.slice(0, 8).map((v, i) => (
            <span key={i} className={`aspect-square rounded-lg outline-1 ${CELL[i % 4]}`} style={{ opacity: 0.35 + v * 0.65 }} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">LiFePO₄ olivine · Pnma · 8 physical descriptors and a 16-d embedding passed to the property model.</p>
      </Panel></Link>

      <Link to="/failure" className="col-span-12 md:col-span-4"><Panel className="h-full transition-colors hover:border-brand/40">
        <Eyebrow>Failure modelling</Eyebrow>
        <div className="mt-3 font-display text-3xl font-semibold">{d.p.yield.toFixed(0)} MPa</div>
        <div className="mt-1 text-xs text-teal">S355 predicted yield · 30-yr PoF {(d.f.end.pof * 100).toFixed(2)}%</div>
        <div className="mt-5"><Bars values={d.f.curve.filter((_, i) => i % 4 === 0).map((c) => c.stress)} highlightFrom={5} /></div>
        <p className="mt-3 text-xs text-muted-foreground">Corrosion thins the section, so effective stress rises over 30 years.</p>
      </Panel></Link>

      <Link to="/insurance" className="col-span-12 md:col-span-4"><Panel className="h-full transition-colors hover:border-brand/40">
        <Eyebrow>Catastrophe pricing</Eyebrow>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold">{(d.loss[0].rate * 100).toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">rate on line · hurricane</span>
        </div>
        <div className="mt-4 space-y-2">
          {d.loss.map((l, i) => (
            <div key={l.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
              <span>{l.name}</span>
              <span className={`font-mono ${["text-brand", "text-teal", "text-violet"][i]}`}>{(l.rate * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </Panel></Link>

      <Panel className="col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Eyebrow>MatRisk Lab · simulation</Eyebrow>
            <div className="mt-2 font-display text-xl font-semibold">Run a material-related financial shock</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.slice(0, 3).map((s, i) => (
              <Link key={s.id} to="/lab" className={`rounded-full border px-3 py-1 text-xs ${["border-brand/30 bg-brand/10 text-brand", "border-teal/30 bg-teal/10 text-teal", "border-violet/30 bg-violet/10 text-violet"][i]}`}>{s.name}</Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted p-4"><div className="font-display text-2xl font-semibold">−{(d.lab.total / 1e6).toFixed(0)}M</div><div className="text-xs text-muted-foreground">Unhedged loss · copper shortage</div></div>
          <div className="rounded-2xl bg-muted p-4"><div className="font-display text-2xl font-semibold text-teal">{d.lab.minDscr.toFixed(2)}×</div><div className="text-xs text-muted-foreground">Minimum DSCR under shock</div></div>
          <div className="rounded-2xl bg-muted p-4"><div className="font-display text-2xl font-semibold text-violet">{d.lab.score}</div><div className="text-xs text-muted-foreground">Baseline score / 1000</div></div>
        </div>
      </Panel>
    </div>
  );
}
