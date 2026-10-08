import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Eyebrow, Meter, PageHeader, Panel, Select, Slider, Stat } from "@/components/matrisk/ui";
import { COMMODITIES, DEFAULT_ENV, encodeCrystal, getMaterial, MATERIALS, predictProperties, type Env } from "@/lib/matrisk";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/materials")({
  head: () => seo("Crystal encoding & property prediction", "Encode crystal structures into descriptors and predict yield strength, stiffness and corrosion within physical limits."),
  component: Materials,
});

function Materials() {
  const [id, setId] = useState("ni3al");
  const [env, setEnv] = useState<Env>(DEFAULT_ENV);
  const m = getMaterial(id);
  const enc = useMemo(() => encodeCrystal(m), [m]);
  const p = useMemo(() => predictProperties(m, env), [m, env]);
  const set = (k: keyof Env) => (v: number) => setEnv((e) => ({ ...e, [k]: v }));
  const sweep = useMemo(() => [0.5, 1, 2, 5, 10, 20, 50, 100].map((d) => ({ d, y: predictProperties(m, { ...env, grainUm: d }).yield })), [m, env]);
  const maxY = Math.max(...sweep.map((s) => s.y));

  return (
    <div className="space-y-4">
      <PageHeader part="Part 2 · Materials" title={<>{m.name} <span className="text-gradient">{m.structure}</span></>} desc={`${m.spaceGroup} · a = ${m.a} Å · ${m.use}. Physics constraints come first; the learned correction is capped at ±5%.`}>
        <div className="w-60"><Select label="Material" value={id} onChange={setId} options={MATERIALS.map((x) => ({ value: x.id, label: x.name }))} /></div>
      </PageHeader>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-12 md:col-span-5">
          <Eyebrow>Structure encoding · descriptors</Eyebrow>
          <div className="mt-4 space-y-3">
            {enc.features.map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{f.label}</span><span className="font-mono">{f.value < 10 ? f.value.toFixed(3) : f.value.toFixed(0)}</span></div>
                <Meter value={f.norm} />
              </div>
            ))}
          </div>
          <Eyebrow className="mt-6">16-d latent embedding</Eyebrow>
          <div className="mt-3 grid grid-cols-8 gap-1.5">
            {enc.embedding.map((v, i) => <span key={i} className={`aspect-square rounded-md ${i % 3 === 0 ? "bg-brand" : i % 3 === 1 ? "bg-teal" : "bg-violet"}`} style={{ opacity: 0.15 + v * 0.85 }} title={v.toFixed(3)} />)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {m.composition.map(([el, x]) => <Badge key={el} tone="teal">{el} {(x * 100).toFixed(0)}%</Badge>)}
          </div>
        </Panel>

        <div className="col-span-12 space-y-4 md:col-span-7">
          <Panel>
            <Eyebrow>Service conditions</Eyebrow>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Slider label="Grain size" value={env.grainUm} min={0.5} max={100} step={0.5} onChange={set("grainUm")} format={(v) => `${v} µm`} />
              <Slider label="Temperature" value={env.tempC} min={-40} max={600} step={5} onChange={set("tempC")} format={(v) => `${v} °C`} />
              <Slider label="Chloride exposure" value={env.chloride} min={0} max={1} step={0.05} onChange={set("chloride")} format={(v) => `${(v * 100).toFixed(0)}%`} />
              <Slider label="pH" value={env.pH} min={2} max={12} step={0.5} onChange={set("pH")} />
            </div>
          </Panel>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Yield strength" value={`${p.yield.toFixed(0)} MPa`} sub={`95% CI ${p.yieldLo.toFixed(0)}–${p.yieldHi.toFixed(0)}`} tone="brand" />
            <Stat label="Young's modulus" value={`${p.E.toFixed(0)} GPa`} sub={`T/Tm = ${p.homologous.toFixed(2)}`} tone="teal" />
            <Stat label="Corrosion rate" value={`${p.corrosion.toFixed(3)}`} sub={`mm/yr · CI ${p.corrLo.toFixed(3)}–${p.corrHi.toFixed(3)}`} tone="violet" />
          </div>
          <Panel>
            <div className="flex items-center justify-between"><Eyebrow>Hall–Petch sweep · yield vs grain size</Eyebrow><span className="font-mono text-xs text-muted-foreground">σy = σ₀ + k/√d</span></div>
            <div className="mt-4 flex h-28 items-end gap-2">
              {sweep.map((s) => (
                <div key={s.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`w-full rounded-t ${s.d === env.grainUm ? "bg-teal" : "bg-brand/40"}`} style={{ height: `${(s.y / maxY) * 90}px` }} />
                  <span className="font-mono text-[10px] text-muted-foreground">{s.d}µm</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <Eyebrow>Physics constraints</Eyebrow>
            <div className="mt-3 divide-y divide-border">
              {p.constraints.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                  <span>{c.name}</span>
                  <span className="flex items-center gap-3"><span className="font-mono text-xs text-muted-foreground">{c.detail}</span><Badge tone={c.passed ? "ok" : "danger"}>{c.passed ? "pass" : "fail"}</Badge></span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Linked commodity: {COMMODITIES[m.commodity].name} at ${COMMODITIES[m.commodity].price.toLocaleString()}{COMMODITIES[m.commodity].unit}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
