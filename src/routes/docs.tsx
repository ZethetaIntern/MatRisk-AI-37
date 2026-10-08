import { createFileRoute } from "@tanstack/react-router";
import { Eyebrow, PageHeader, Panel } from "@/components/matrisk/ui";
import { runValidation } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/docs")({
  head: () => seo("Architecture & documentation", "MatRisk AI dual-domain architecture, model formulas and submission package for Zetheta."),
  component: Docs,
});

const MODULES = [
  ["1 · Architecture", "Materials layer (encoding → property prediction → failure) feeds a risk bus consumed by finance modules."],
  ["2 · Materials", "8 physical descriptors + 16-d embedding. Hall–Petch yield with thermal softening, Arrhenius corrosion, ±5% learned residual, ideal-strength ceiling."],
  ["3 · Failure", "Corrosion section loss raises stress; Weibull PoF(t) = 1 − exp(−(σ(t)/σy)^β); Basquin fatigue; expected loss = PoF × asset value."],
  ["4 · Commodities & PF", "One-factor correlated GBM Monte Carlo VaR/ES. Project finance: capex shocked by commodity share, maintenance uplift from PoF, DSCR/LLCR/NPV, breach probability."],
  ["5 · Insurance & ESG", "Poisson × lognormal cat model with logistic, material-adjusted vulnerability; EAL, OEP/AEP, PML, technical premium. ESG: WACI, scores, carbon cost, material-risk tilt."],
  ["6 · MatRisk Lab", "Scenario game: budgeted defences, all engines run per round, score/XP/levels/badges saved in browser."],
  ["7 · Validation", "MAPE/R², physics sweep, Kupiec VaR backtest, DSCR & PoF monotonicity, cat MC vs integration."],
];

function download() {
  const v = runValidation();
  const md = `# MatRisk AI — Submission to Zetheta\n\n## Modules\n${MODULES.map(([a, b]) => `### ${a}\n${b}\n`).join("\n")}\n## Validation results\n${v.tests.map((t) => `- [${t.passed ? "PASS" : "FAIL"}] ${t.useCase} — ${t.name}: ${t.metric} (threshold ${t.threshold})`).join("\n")}\n`;
  const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url; a.download = "MatRisk-AI-Documentation.md"; a.click();
  URL.revokeObjectURL(url);
}

function Docs() {
  return (
    <div className="space-y-4">
      <PageHeader part="Final · Documentation" title={<>System <span className="text-gradient">architecture</span></>} desc="How the materials and finance domains connect, the formulas behind each model, and a downloadable submission document.">
        <button onClick={download} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Download documentation</button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map(([t, d]) => (
          <Panel key={t}><Eyebrow>{t}</Eyebrow><p className="mt-3 text-sm text-muted-foreground">{d}</p></Panel>
        ))}
      </div>
    </div>
  );
}
