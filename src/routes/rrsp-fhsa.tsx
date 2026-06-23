import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapleLeaf } from "@/components/maple-leaf";
import { PiggyBank } from "lucide-react";

export const Route = createFileRoute("/rrsp-fhsa")({
  head: () => ({
    meta: [
      { title: "RRSP & FHSA Optimizer 2025 — Maple & Ledger" },
      { name: "description", content: "Find the optimal RRSP and FHSA contribution split to maximize your 2025 Canadian tax refund." },
      { property: "og:title", content: "RRSP & FHSA Optimizer 2025" },
      { property: "og:description", content: "Maximize your 2025 refund with the right RRSP / FHSA split." },
    ],
  }),
  component: OptimizerPage,
});

// Combined marginal rates for 2025 (federal + provincial top-of-bracket approximations)
const PROV_TOP: Record<string, { name: string; brackets: { upTo: number; combined: number }[] }> = {
  ON: { name: "Ontario", brackets: [
    { upTo: 52886, combined: 0.2005 }, { upTo: 57375, combined: 0.2415 },
    { upTo: 93132, combined: 0.2965 }, { upTo: 105775, combined: 0.3148 },
    { upTo: 109727, combined: 0.3389 }, { upTo: 114750, combined: 0.3791 },
    { upTo: 150000, combined: 0.4341 }, { upTo: 177882, combined: 0.4441 },
    { upTo: 220000, combined: 0.4797 }, { upTo: 253414, combined: 0.4897 },
    { upTo: Infinity, combined: 0.5353 },
  ]},
  BC: { name: "British Columbia", brackets: [
    { upTo: 49279, combined: 0.2006 }, { upTo: 57375, combined: 0.227 },
    { upTo: 98560, combined: 0.282 }, { upTo: 113158, combined: 0.31 },
    { upTo: 114750, combined: 0.3279 }, { upTo: 137407, combined: 0.3829 },
    { upTo: 177882, combined: 0.407 }, { upTo: 186306, combined: 0.437 },
    { upTo: 253414, combined: 0.458 }, { upTo: Infinity, combined: 0.535 },
  ]},
  AB: { name: "Alberta", brackets: [
    { upTo: 57375, combined: 0.23 }, { upTo: 60000, combined: 0.255 },
    { upTo: 114750, combined: 0.305 }, { upTo: 151234, combined: 0.36 },
    { upTo: 177882, combined: 0.38 }, { upTo: 181481, combined: 0.41 },
    { upTo: 241974, combined: 0.42 }, { upTo: Infinity, combined: 0.48 },
  ]},
  QC: { name: "Québec", brackets: [
    { upTo: 53255, combined: 0.2753 }, { upTo: 57375, combined: 0.3253 },
    { upTo: 106495, combined: 0.3712 }, { upTo: 114750, combined: 0.4212 },
    { upTo: 129590, combined: 0.4571 }, { upTo: 177882, combined: 0.4746 },
    { upTo: 253414, combined: 0.5046 }, { upTo: Infinity, combined: 0.5375 },
  ]},
};

function marginal(income: number, province: string) {
  const p = PROV_TOP[province] ?? PROV_TOP.ON;
  return (p.brackets.find((b) => income <= b.upTo) ?? p.brackets[p.brackets.length - 1]).combined;
}

function avgRefundRate(income: number, deduction: number, province: string) {
  // Approximate refund: tax savings = integral of marginal rate over [income-deduction, income]
  if (deduction <= 0) return 0;
  const p = PROV_TOP[province] ?? PROV_TOP.ON;
  let lower = income - deduction;
  let upper = income;
  let saved = 0;
  for (const b of p.brackets) {
    if (lower >= upper) break;
    if (b.upTo <= lower) continue;
    const slice = Math.min(upper, b.upTo) - lower;
    if (slice > 0) saved += slice * b.combined;
    lower = Math.min(upper, b.upTo);
  }
  return saved / deduction;
}

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function OptimizerPage() {
  const [income, setIncome] = useState(95000);
  const [province, setProvince] = useState("ON");
  const [rrspRoom, setRrspRoom] = useState(18000);
  const [fhsaRoom, setFhsaRoom] = useState(8000);
  const [firstHome, setFirstHome] = useState("yes");
  const [cash, setCash] = useState(20000);

  const result = useMemo(() => {
    const top = marginal(income, province);
    // Both RRSP & FHSA are above-the-line deductions. Cap to room + cash.
    const fhsaUse = firstHome === "yes" ? Math.min(fhsaRoom, cash) : 0;
    const remaining = Math.max(0, cash - fhsaUse);
    const rrspUse = Math.min(rrspRoom, remaining);
    const totalDeduction = fhsaUse + rrspUse;
    const refundRate = avgRefundRate(income, totalDeduction, province);
    const refund = totalDeduction * refundRate;
    return { top, fhsaUse, rrspUse, totalDeduction, refund, refundRate };
  }, [income, province, rrspRoom, fhsaRoom, firstHome, cash]);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
      <div className="flex items-center gap-3">
        <PiggyBank className="h-7 w-7 text-primary" />
        <p className="text-xs uppercase tracking-widest text-primary">RRSP + FHSA · 2025</p>
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">
        Optimize your <span className="italic text-primary">refund</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        We split your contribution across FHSA (first-home priority) and RRSP, then estimate the federal + provincial tax you'll get back.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-5 rounded-2xl border border-border bg-card p-6">
          <Field label="Annual income"><Money value={income} onChange={setIncome} /></Field>
          <Field label="Province">
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(PROV_TOP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.name}</SelectItem>
              ))}</SelectContent>
            </Select>
          </Field>
          <Field label="Cash you can contribute"><Money value={cash} onChange={setCash} /></Field>
          <Field label="RRSP room available"><Money value={rrspRoom} onChange={setRrspRoom} /></Field>
          <Field label="FHSA room available"><Money value={fhsaRoom} onChange={setFhsaRoom} /></Field>
          <Field label="First-time home buyer?">
            <Select value={firstHome} onValueChange={setFirstHome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes — prioritize FHSA</SelectItem>
                <SelectItem value="no">No — RRSP only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-paper p-6 ring-maple">
          <h2 className="font-display text-2xl">Recommended contribution</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat label="FHSA" value={fmt(result.fhsaUse)} />
            <Stat label="RRSP" value={fmt(result.rrspUse)} />
            <Stat label="Total deduction" value={fmt(result.totalDeduction)} />
            <Stat label="Estimated refund" value={fmt(result.refund)} primary />
          </div>
          <div className="mt-6 border-t border-border pt-6 grid grid-cols-2 gap-4">
            <Stat label="Marginal rate" value={`${(result.top * 100).toFixed(1)}%`} small />
            <Stat label="Effective refund rate" value={`${(result.refundRate * 100).toFixed(1)}%`} small />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            FHSA fills first when you're a first-time home buyer because contributions are deductible AND withdrawals for a home are tax-free.
            Combined federal + provincial brackets are approximations. Excludes credits, CPP/EI and OAS clawback.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
function Money({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
      <Input type="number" min={0} step={500} value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} className="pl-7" />
    </div>
  );
}
function Stat({ label, value, primary, small }: { label: string; value: string; primary?: boolean; small?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={(primary ? "text-primary " : "text-foreground ") + "font-display " + (small ? "text-xl mt-1" : "text-3xl mt-1")}>{value}</div>
    </div>
  );
}

// Re-export MapleLeaf to avoid lint complaining about unused import in some setups
void MapleLeaf;
