import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eyebrow, LineChart, PageHeader, Panel, Slider, Stat } from "@/components/matrisk/ui";
import { bookVaR, COMMODITIES, DEFAULT_BOOK, fmtMoney, histogram, pct, pricePaths, type CommodityId, type Position } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/commodities")({
  head: () => seo("Commodity trading desk", "Monte Carlo VaR and expected shortfall for a metals book, with shocks tied to material demand."),
  component: Commodities,
});

const COLORS = ["stroke-brand", "stroke-teal", "stroke-violet", "stroke-warn", "stroke-ok", "stroke-danger"];

function Commodities() {
  const [book, setBook] = useState<Position[]>(DEFAULT_BOOK);
  const [horizon, setHorizon] = useState(10);
  const [shockSym, setShockSym] = useState<CommodityId>("CU");
  const [shock, setShock] = useState(0);
  const [volMult, setVolMult] = useState(1);
  const paths = useMemo(() => pricePaths(90), []);
  const res = useMemo(() => bookVaR(book, { horizon, sims: 6000, shock: { [shockSym]: shock }, volMult }), [book, horizon, shockSym, shock, volMult]);
  const hist = useMemo(() => histogram(res.pnl, 40), [res]);
  const varBin = Math.floor((-res.var99 - hist.min) / hist.w);

  return (
    <div className="space-y-4">
      <PageHeader part="Part 4 · Commodity desk" title={<>Metals book <span className="text-gradient">VaR & ES</span></>} desc="A one-factor correlated Monte Carlo over six material commodities (6,000 paths). Shocks can be tied to material demand or supply events from the materials models." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Gross exposure" value={fmtMoney(res.gross)} />
        <Stat label={`VaR 95% · ${horizon}d`} value={fmtMoney(res.var95)} tone="brand" />
        <Stat label={`VaR 99% · ${horizon}d`} value={fmtMoney(res.var99)} tone="violet" />
        <Stat label="ES 97.5%" value={fmtMoney(res.es975)} tone="danger" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 md:col-span-7">
          <Eyebrow>Positions (tonnes · negative = short)</Eyebrow>
          <div className="mt-3 divide-y divide-border">
            {book.map((p, i) => {
              const c = COMMODITIES[p.sym];
              const last = paths[p.sym][paths[p.sym].length - 1];
              return (
                <div key={p.sym} className="grid grid-cols-12 items-center gap-3 py-2.5 text-sm">
                  <span className="col-span-3"><span className="font-mono text-xs text-brand">{p.sym}</span> <span className="text-muted-foreground">{c.name}</span></span>
                  <span className="col-span-2 text-right font-mono text-xs">${c.price.toLocaleString()}</span>
                  <span className={`col-span-2 text-right font-mono text-xs ${last >= c.price ? "text-ok" : "text-danger"}`}>{pct(last / c.price - 1)}</span>
                  <input type="number" value={p.qty} aria-label={`${p.sym} quantity`} onChange={(e) => setBook((b) => b.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} className="col-span-3 rounded-lg border border-border bg-muted px-2 py-1 text-right font-mono text-xs outline-none focus:border-brand" />
                  <span className="col-span-2 text-right font-mono text-xs text-muted-foreground">{fmtMoney(p.qty * c.price)}</span>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel className="col-span-12 space-y-5 md:col-span-5">
          <Eyebrow>Scenario controls</Eyebrow>
          <Slider label="Horizon" value={horizon} min={1} max={60} step={1} onChange={setHorizon} format={(v) => `${v} days`} />
          <Slider label="Volatility multiplier" value={volMult} min={0.5} max={3} step={0.1} onChange={setVolMult} format={(v) => `${v.toFixed(1)}×`} />
          <div>
            <div className="mb-2 text-xs text-muted-foreground">Shocked commodity</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(COMMODITIES) as CommodityId[]).map((k) => (
                <button key={k} onClick={() => setShockSym(k)} className={`rounded-full border px-3 py-1 text-xs ${shockSym === k ? "border-brand/40 bg-brand/15 text-brand" : "border-border text-muted-foreground"}`}>{k}</button>
              ))}
            </div>
          </div>
          <Slider label={`${COMMODITIES[shockSym].name} price shock`} value={shock} min={-0.6} max={0.6} step={0.02} onChange={setShock} format={(v) => pct(v, 0)} />
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Mean scenario P&L: <span className={res.mean >= 0 ? "text-ok" : "text-danger"}>{fmtMoney(res.mean)}</span></div>
        </Panel>
        <Panel className="col-span-12 md:col-span-6">
          <Eyebrow>P&L distribution · red bars beyond VaR 99%</Eyebrow>
          <div className="mt-4 flex h-40 items-end gap-0.5">
            {hist.h.map((v, i) => <span key={i} className={`w-full rounded-t ${i <= varBin ? "bg-danger/70" : "bg-brand/50"}`} style={{ height: `${(v / Math.max(...hist.h)) * 100}%` }} />)}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>{fmtMoney(hist.min)}</span><span>{fmtMoney(hist.max)}</span></div>
        </Panel>
        <Panel className="col-span-12 md:col-span-6">
          <Eyebrow>90-day simulated prices (indexed)</Eyebrow>
          <div className="mt-4"><LineChart series={Object.entries(paths).map(([k, v], i) => ({ values: v.map((x) => x / COMMODITIES[k as CommodityId].price), className: COLORS[i] }))} height={160} xLabels={["t0", "t+90"]} /></div>
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px]">
            {Object.keys(paths).map((k, i) => <span key={k} className={COLORS[i].replace("stroke-", "text-")}>● {k}</span>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}
