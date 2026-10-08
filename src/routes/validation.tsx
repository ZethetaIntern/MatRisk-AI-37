import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Badge, Eyebrow, PageHeader, Panel, Stat } from "@/components/matrisk/ui";
import { runValidation } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/validation")({
  head: () => seo("Validation report", "Backtests and checks for the MatRisk AI models across materials, commodity, infrastructure and insurance use cases."),
  component: Validation,
});

function Validation() {
  const v = useMemo(() => runValidation(), []);
  const passed = v.tests.filter((t) => t.passed).length;
  const maxRef = Math.max(...v.props.map((p) => Math.max(p.ref, p.pred)));
  return (
    <div className="space-y-4">
      <PageHeader part="Part 7 · Validation" title={<>Validated across <span className="text-gradient">three risk domains</span></>} desc="Every test runs live in your browser with fixed seeds, so results can be reproduced. Thresholds follow standard practice: Kupiec POF at 95% confidence, MAPE under 10%, and Monte Carlo error under 5%." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Tests passed" value={`${passed}/${v.tests.length}`} tone={passed === v.tests.length ? "ok" : "warn"} big />
        <Stat label="Property MAPE" value={`${(v.mape * 100).toFixed(1)}%`} tone="brand" />
        <Stat label="Property R²" value={v.r2.toFixed(3)} tone="teal" />
        <Stat label="Use cases" value="3" sub="commodity · infrastructure · insurance" tone="violet" />
      </div>
      <Panel>
        <Eyebrow>Test suite</Eyebrow>
        <div className="mt-3 divide-y divide-border">
          {v.tests.map((t) => (
            <div key={t.name} className="grid grid-cols-12 items-center gap-3 py-3 text-sm">
              <span className="col-span-2"><Badge tone="brand">{t.useCase}</Badge></span>
              <span className="col-span-4">{t.name}</span>
              <span className="col-span-3 font-mono text-xs text-muted-foreground">{t.metric}</span>
              <span className="col-span-2 font-mono text-xs text-muted-foreground">{t.threshold}</span>
              <span className="col-span-1 text-right"><Badge tone={t.passed ? "ok" : "danger"}>{t.passed ? "pass" : "fail"}</Badge></span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <Eyebrow>Predicted vs reference yield strength (MPa)</Eyebrow>
        <div className="mt-4 space-y-3">
          {v.props.map((p) => (
            <div key={p.id} className="grid grid-cols-12 items-center gap-3 text-xs">
              <span className="col-span-3 font-mono">{p.id}</span>
              <div className="col-span-7 space-y-1">
                <div className="h-2 rounded-full bg-brand/70" style={{ width: `${(p.pred / maxRef) * 100}%` }} />
                <div className="h-2 rounded-full bg-violet/60" style={{ width: `${(p.ref / maxRef) * 100}%` }} />
              </div>
              <span className="col-span-2 text-right font-mono text-muted-foreground">{p.pred.toFixed(0)} / {p.ref}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 font-mono text-[10px]"><span className="text-brand">● predicted</span><span className="text-violet">● reference</span></div>
      </Panel>
    </div>
  );
}
