import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Eyebrow, Meter, PageHeader, Panel, Stat } from "@/components/matrisk/ui";
import { ACTIONS, fmtMoney, runLabRound, SCENARIOS } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/lab")({
  head: () => seo("MatRisk Lab", "A game where you defend a portfolio against shocks such as copper shortages, corrosion cascades and Cat-5 storms."),
  component: Lab,
});

const BUDGET = 80;
const KEY = "matrisk-lab-v1";
type Save = { xp: number; best: Record<string, number>; rounds: number };
const BADGES = [
  { id: "first", name: "First shock", test: (s: Save) => s.rounds >= 1 },
  { id: "seven", name: "Score 700+", test: (s: Save) => Object.values(s.best).some((v) => v >= 700) },
  { id: "nine", name: "Risk architect · 900+", test: (s: Save) => Object.values(s.best).some((v) => v >= 900) },
  { id: "all", name: "All scenarios cleared", test: (s: Save) => SCENARIOS.every((x) => (s.best[x.id] ?? 0) >= 600) },
];

function Lab() {
  const [scId, setScId] = useState(SCENARIOS[0].id);
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<ReturnType<typeof runLabRound> | null>(null);
  const [baseline, setBaseline] = useState<ReturnType<typeof runLabRound> | null>(null);
  const [save, setSave] = useState<Save>({ xp: 0, best: {}, rounds: 0 });

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setSave(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  const sc = SCENARIOS.find((s) => s.id === scId)!;
  const spent = picked.reduce((s, id) => s + (ACTIONS.find((a) => a.id === id)?.cost ?? 0), 0);
  const level = Math.floor(save.xp / 500) + 1;

  const toggle = (id: string) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      const cost = ACTIONS.find((a) => a.id === id)!.cost;
      return spent + cost <= BUDGET ? [...p, id] : p;
    });
  };

  const trigger = () => {
    const seed = Math.floor(Math.random() * 1e9);
    const r = runLabRound(sc, picked, seed);
    setResult(r);
    setBaseline(runLabRound(sc, [], seed));
    const next: Save = { xp: save.xp + r.score, rounds: save.rounds + 1, best: { ...save.best, [sc.id]: Math.max(save.best[sc.id] ?? 0, r.score) } };
    setSave(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <PageHeader part="Part 6 · MatRisk Lab" title={<>Survive the <span className="text-gradient">shock</span></>} desc={`Pick a scenario and spend up to ${BUDGET} risk points on defences, then trigger the shock. All five risk engines run with a new random seed each round.`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="eyebrow">Level</div><div className="font-display text-2xl font-semibold text-brand">{level}</div></div>
          <div><div className="eyebrow">XP</div><div className="font-display text-2xl font-semibold">{save.xp.toLocaleString()}</div></div>
          <div><div className="eyebrow">Rounds</div><div className="font-display text-2xl font-semibold text-teal">{save.rounds}</div></div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => { setScId(s.id); setResult(null); }} className={`glass p-5 text-left transition-colors ${s.id === scId ? "border-brand/50" : "hover:border-brand/30"}`}>
            <div className="flex items-center justify-between"><span className="font-display font-semibold">{s.name}</span><span className="font-mono text-xs text-warn">{"◆".repeat(s.difficulty)}</span></div>
            <p className="mt-2 text-xs text-muted-foreground">{s.blurb}</p>
            <div className="mt-3 font-mono text-[11px] text-muted-foreground">Best: <span className="text-teal">{save.best[s.id] ?? "—"}</span></div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 md:col-span-7">
          <div className="flex items-center justify-between"><Eyebrow>Defences</Eyebrow><span className="font-mono text-xs"><span className={spent > BUDGET * 0.8 ? "text-warn" : "text-brand"}>{spent}</span> / {BUDGET} pts</span></div>
          <Meter value={spent / BUDGET} className="mt-3" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ACTIONS.map((a) => {
              const on = picked.includes(a.id);
              const blocked = !on && spent + a.cost > BUDGET;
              return (
                <button key={a.id} onClick={() => toggle(a.id)} disabled={blocked} className={`rounded-2xl border p-4 text-left transition-colors ${on ? "border-teal/50 bg-teal/10" : "border-border bg-muted hover:border-brand/30"} ${blocked ? "opacity-40" : ""}`}>
                  <div className="flex items-center justify-between text-sm font-medium"><span>{a.name}</span><span className="font-mono text-xs text-brand">{a.cost}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                </button>
              );
            })}
          </div>
          <button onClick={trigger} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Trigger {sc.name} →</button>
        </Panel>

        <Panel className="col-span-12 md:col-span-5">
          <Eyebrow>Round result</Eyebrow>
          {!result ? (
            <p className="mt-6 text-sm text-muted-foreground">Choose your defences and trigger the shock to see losses on each desk.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-end gap-2"><span className="font-display text-6xl font-bold text-gradient">{result.score}</span><span className="mb-2 text-sm text-muted-foreground">/ 1000</span></div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total loss" value={fmtMoney(result.total)} tone="danger" sub={baseline ? `unhedged ${fmtMoney(baseline.total)}` : undefined} />
                <Stat label="Min DSCR" value={`${result.minDscr.toFixed(2)}×`} tone={result.minDscr < 1.2 ? "warn" : "ok"} />
              </div>
              <div className="space-y-2">
                {result.lines.map((l, i) => {
                  const b = baseline?.lines[i].v ?? l.v;
                  return (
                    <div key={l.k}>
                      <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{l.k}</span><span className="font-mono">{fmtMoney(l.v)}{b > l.v * 1.05 && <span className="ml-2 text-ok">saved {fmtMoney(b - l.v)}</span>}</span></div>
                      <Meter value={l.v / Math.max(...result.lines.map((x) => x.v))} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <Eyebrow className="mt-6">Badges</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            {BADGES.map((b) => <span key={b.id} className={b.test(save) ? "" : "opacity-30"}><Badge tone={b.test(save) ? "violet" : "brand"}>{b.name}</Badge></span>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}
