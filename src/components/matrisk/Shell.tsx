import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/materials", label: "Materials" },
  { to: "/failure", label: "Failure" },
  { to: "/commodities", label: "Commodities" },
  { to: "/project-finance", label: "Project finance" },
  { to: "/insurance", label: "Insurance" },
  { to: "/esg", label: "ESG" },
  { to: "/lab", label: "Lab" },
  { to: "/validation", label: "Validation" },
  { to: "/docs", label: "Docs" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="animate-drift absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[130px]" />
        <div className="animate-drift2 absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-teal/15 blur-[130px]" />
        <div className="animate-drift absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-violet/15 blur-[130px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-glass-border bg-glass px-5 py-3 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand font-display font-bold text-primary-foreground">M</span>
            <span className="font-display text-lg font-semibold tracking-tight">MatRisk <span className="text-brand">AI</span></span>
          </Link>
          <nav className="-mx-1 flex max-w-full gap-1 overflow-x-auto text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-muted text-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mt-6">{children}</main>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Commodity desk · infrastructure project finance · insurance cat · ESG analytics</span>
          <span className="font-mono">MatRisk AI · v1.0 · prepared for Zetheta</span>
        </footer>
      </div>
    </div>
  );
}
