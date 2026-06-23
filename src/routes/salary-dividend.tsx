import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/salary-dividend")({
  head: () => ({
    meta: [
      { title: "Salary vs Dividend Calculator 2025 — Maple & Ledger" },
      { name: "description", content: "Compare salary, eligible and non-eligible dividends for a Canadian small-business owner in 2025." },
      { property: "og:title", content: "Salary vs Dividend Calculator 2025" },
      { property: "og:description", content: "See which way you keep more after personal + corporate tax." },
    ],
  }),
  component: SalDivPage,
});

// Combined personal marginal rate brackets (ordinary income), 2025 approximations
const PERSONAL: Record<string, { name: string; brackets: { upTo: number; rate: number }[]; topEligibleDiv: number; topNonEligibleDiv: number }> = {
  ON: { name: "Ontario", topEligibleDiv: 0.3953, topNonEligibleDiv: 0.4774, brackets: [
    { upTo: 57375, rate: 0.2005 }, { upTo: 93132, rate: 0.2965 },
    { upTo: 114750, rate: 0.3148 }, { upTo: 150000, rate: 0.4341 },
    { upTo: 220000, rate: 0.4797 }, { upTo: Infinity, rate: 0.5353 },
  ]},
  BC: { name: "British Columbia", topEligibleDiv: 0.3678, topNonEligibleDiv: 0.4869, brackets: [
    { upTo: 49279, rate: 0.2006 }, { upTo: 98560, rate: 0.282 },
    { upTo: 137407, rate: 0.3829 }, { upTo: 186306, rate: 0.437 },
    { upTo: 253414, rate: 0.458 }, { upTo: Infinity, rate: 0.535 },
  ]},
  AB: { name: "Alberta", topEligibleDiv: 0.3431, topNonEligibleDiv: 0.4231, brackets: [
    { upTo: 57375, rate: 0.23 }, { upTo: 114750, rate: 0.305 },
    { upTo: 151234, rate: 0.36 }, { upTo: 181481, rate: 0.41 },
    { upTo: Infinity, rate: 0.48 },
  ]},
  QC: { name: "Québec", topEligibleDiv: 0.4025, topNonEligibleDiv: 0.4870, brackets: [
    { upTo: 53255, rate: 0.2753 }, { upTo: 106495, rate: 0.3712 },
    { upTo: 129590, rate: 0.4571 }, { upTo: Infinity, rate: 0.5375 },
  ]},
};

const SBD_RATE = 0.12;      // CCPC small-business rate (federal + provincial avg) on active income up to $500k
const GENERAL_CORP = 0.265; // general corporate rate
const PAYROLL_BURDEN = 0.075; // employer CPP+EI on salary, approx

function taxFromBrackets(income: number, brackets: { upTo: number; rate: number }[]) {
  let lower = 0, tax = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const slice = Math.min(income, b.upTo) - lower;
    tax += slice * b.rate;
    lower = b.upTo;
  }
  return tax;
}

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function SalDivPage() {
  const [corpProfit, setCorpProfit] = useState(180000);
  const [province, setProvince] = useState("ON");
  const [need, setNeed] = useState(100000);
  const [divType, setDivType] = useState<"non" | "eligible">("non");
  const [sbdEligible, setSbdEligible] = useState("yes");

  const result = useMemo(() => {
    const p = PERSONAL[province];
    const corpRate = sbdEligible === "yes" ? SBD_RATE : GENERAL_CORP;

    // Salary path: company pays salary + payroll burden, deductible against corp profit
    const salaryGross = need / (1 - 0.30); // rough gross-up so net ~ need; we'll recompute personal tax precisely
    // Iteratively find a salary gross that yields net = need after personal tax
    const findGross = () => {
      let lo = need, hi = need * 2;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        const personalTax = taxFromBrackets(mid, p.brackets);
        const net = mid - personalTax;
        if (net < need) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const grossSalary = Math.min(findGross(), corpProfit / (1 + PAYROLL_BURDEN));
    const employerCost = grossSalary * (1 + PAYROLL_BURDEN);
    const corpProfitAfterSalary = Math.max(0, corpProfit - employerCost);
    const corpTaxSalary = corpProfitAfterSalary * corpRate;
    const personalTaxSalary = taxFromBrackets(grossSalary, p.brackets);
    const totalTaxSalary = corpTaxSalary + personalTaxSalary + grossSalary * PAYROLL_BURDEN; // payroll burden is a real cost
    const familyCashSalary = (grossSalary - personalTaxSalary) + (corpProfitAfterSalary - corpTaxSalary);

    // Dividend path
    const corpTaxDiv = corpProfit * corpRate;
    const afterTaxCorp = corpProfit - corpTaxDiv;
    const divPaid = Math.min(afterTaxCorp, need * 1.4); // pay roughly what's needed to net ~need
    // Personal tax on dividend — use blended top rate as approximation
    const divRate = divType === "eligible" ? p.topEligibleDiv * 0.85 : p.topNonEligibleDiv * 0.85;
    const personalTaxDiv = divPaid * divRate;
    const retainedAfterDiv = afterTaxCorp - divPaid;
    const totalTaxDiv = corpTaxDiv + personalTaxDiv;
    const familyCashDiv = (divPaid - personalTaxDiv) + retainedAfterDiv;

    return {
      salary: { gross: grossSalary, employerCost, corpTax: corpTaxSalary, personalTax: personalTaxSalary, totalTax: totalTaxSalary, familyCash: familyCashSalary },
      dividend: { divPaid, corpTax: corpTaxDiv, personalTax: personalTaxDiv, totalTax: totalTaxDiv, familyCash: familyCashDiv },
      winner: familyCashSalary > familyCashDiv ? "salary" : "dividend",
      delta: Math.abs(familyCashSalary - familyCashDiv),
    };
  }, [corpProfit, province, need, divType, sbdEligible]);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
      <div className="flex items-center gap-3">
        <Scale className="h-7 w-7 text-primary" />
        <p className="text-xs uppercase tracking-widest text-primary">Owner-manager · 2025</p>
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">
        Salary vs <span className="italic text-primary">dividend</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Compare the two main ways to pay yourself from a CCPC. We look at corporate tax, personal tax, payroll burden, and what your family actually keeps.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-5 rounded-2xl border border-border bg-card p-6">
          <F label="Corporate profit before owner pay"><M value={corpProfit} onChange={setCorpProfit} /></F>
          <F label="Personal cash needed (net)"><M value={need} onChange={setNeed} /></F>
          <F label="Province">
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(PERSONAL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.name}</SelectItem>
              ))}</SelectContent>
            </Select>
          </F>
          <F label="Qualifies for small business deduction?">
            <Select value={sbdEligible} onValueChange={setSbdEligible}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes — CCPC under $500k active</SelectItem>
                <SelectItem value="no">No — general rate</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Dividend type">
            <Select value={divType} onValueChange={(v) => setDivType(v as "non" | "eligible")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="non">Non-eligible (typical CCPC)</SelectItem>
                <SelectItem value="eligible">Eligible (general-rate income)</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border-2 border-primary/30 bg-paper p-6 ring-maple">
            <p className="text-xs uppercase tracking-widest text-primary">Recommendation</p>
            <h2 className="mt-2 font-display text-3xl">
              {result.winner === "salary" ? "Take a salary" : "Take a dividend"} —{" "}
              <span className="text-primary">{fmt(result.delta)}</span> more in pocket.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Salary path" tone={result.winner === "salary" ? "primary" : "muted"}>
              <Row label="Gross salary" value={fmt(result.salary.gross)} />
              <Row label="Employer payroll cost" value={fmt(result.salary.employerCost)} />
              <Row label="Corporate tax" value={fmt(result.salary.corpTax)} />
              <Row label="Personal tax" value={fmt(result.salary.personalTax)} />
              <Row label="Family keeps" value={fmt(result.salary.familyCash)} bold />
            </Card>
            <Card title="Dividend path" tone={result.winner === "dividend" ? "primary" : "muted"}>
              <Row label="Dividend paid" value={fmt(result.dividend.divPaid)} />
              <Row label="Corporate tax" value={fmt(result.dividend.corpTax)} />
              <Row label="Personal tax on dividend" value={fmt(result.dividend.personalTax)} />
              <Row label="Family keeps" value={fmt(result.dividend.familyCash)} bold />
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Estimates only. Excludes CPP retirement benefits, RRSP room creation (salary only), passive income grind-down, and integration imperfections. Talk to an accountant before changing your remuneration mix.
          </p>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
function M({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
      <Input type="number" min={0} step={1000} value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} className="pl-7" />
    </div>
  );
}
function Card({ title, tone, children }: { title: string; tone: "primary" | "muted"; children: React.ReactNode }) {
  return (
    <div className={"rounded-2xl border p-5 " + (tone === "primary" ? "border-primary bg-primary/5" : "border-border bg-card")}>
      <h3 className="font-display text-xl mb-3">{title}</h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={"flex justify-between border-b border-border/50 last:border-0 pb-1.5 " + (bold ? "font-display text-base pt-2 border-t border-border/50 mt-2" : "text-muted-foreground")}>
      <span>{label}</span><span className={bold ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}
