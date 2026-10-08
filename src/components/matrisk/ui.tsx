import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("glass p-6", className)}>{children}</section>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

export function PageHeader({ part, title, desc, children }: { part: string; title: ReactNode; desc: string; children?: ReactNode }) {
  return (
    <Panel className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="inline-block rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand">{part}</span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
        {children}
      </div>
    </Panel>
  );
}

const toneClass = { default: "", brand: "text-brand", teal: "text-teal", violet: "text-violet", warn: "text-warn", danger: "text-danger", ok: "text-ok" };
export type Tone = keyof typeof toneClass;

export function Stat({ label, value, sub, tone = "default", big }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; big?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <div className="eyebrow">{label}</div>
      <div className={cn("mt-2 font-display font-semibold tabular-nums", big ? "text-3xl" : "text-2xl", toneClass[tone])}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-brand">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  );
}

export function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs text-muted-foreground">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "teal" | "violet" | "warn" | "danger" | "ok" }) {
  const map = {
    brand: "border-brand/30 bg-brand/10 text-brand", teal: "border-teal/30 bg-teal/10 text-teal", violet: "border-violet/30 bg-violet/10 text-violet",
    warn: "border-warn/30 bg-warn/10 text-warn", danger: "border-danger/30 bg-danger/10 text-danger", ok: "border-ok/30 bg-ok/10 text-ok",
  };
  return <span className={cn("inline-block rounded-full border px-3 py-1 text-xs", map[tone])}>{children}</span>;
}

type Series = { values: number[]; className: string; dashed?: boolean };
export function LineChart({ series, height = 160, refLine, xLabels }: { series: Series[]; height?: number; refLine?: { y: number; label: string }; xLabels?: [string, string] }) {
  const all = series.flatMap((s) => s.values).concat(refLine ? [refLine.y] : []);
  const min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1;
  const W = 100;
  const y = (v: number) => height - 8 - ((v - min) / span) * (height - 16);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={W} y1={height * g} y2={height * g} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
        {refLine && <line x1={0} x2={W} y1={y(refLine.y)} y2={y(refLine.y)} className="stroke-danger" strokeDasharray="4 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
        {series.map((s, i) => {
          const d = s.values.map((v, j) => `${j === 0 ? "M" : "L"}${(j / Math.max(1, s.values.length - 1)) * W},${y(v)}`).join(" ");
          return <path key={i} d={d} fill="none" className={s.className} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      {(xLabels || refLine) && (
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{xLabels?.[0]}</span>
          {refLine && <span className="text-danger">— {refLine.label}</span>}
          <span>{xLabels?.[1]}</span>
        </div>
      )}
    </div>
  );
}

export function Bars({ values, height = 64, highlightFrom, className = "bg-brand/50", highlightClass = "bg-teal/70" }: { values: number[]; height?: number; highlightFrom?: number; className?: string; highlightClass?: string }) {
  const max = Math.max(...values, 1e-9);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {values.map((v, i) => (
        <span key={i} className={cn("w-full rounded-t", highlightFrom !== undefined && i >= highlightFrom ? highlightClass : className)} style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-gradient-brand transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}
