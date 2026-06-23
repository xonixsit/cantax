import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapleLeaf } from "@/components/maple-leaf";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Canadian Tax Calculator 2025 — Maple & Ledger" },
      { name: "description", content: "Estimate your 2025 Canadian federal and provincial income tax. Includes basic personal amount, CPP and EI." },
      { property: "og:title", content: "Canadian Tax Calculator 2025 — Maple & Ledger" },
      { property: "og:description", content: "Estimate your 2025 Canadian federal and provincial income tax with all 13 provinces and territories." },
    ],
  }),
  component: CalculatorPage,
});

// 2025 federal brackets (CRA, illustrative).
const FEDERAL = [
  { upTo: 57375, rate: 0.15 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];
const FEDERAL_BPA = 16129;

type ProvKey =
  | "ON" | "QC" | "BC" | "AB" | "MB" | "SK" | "NS" | "NB" | "NL" | "PE" | "YT" | "NT" | "NU";

const PROVINCES: Record<ProvKey, { name: string; brackets: { upTo: number; rate: number }[]; bpa: number }> = {
  ON: { name: "Ontario", bpa: 12747, brackets: [
    { upTo: 52886, rate: 0.0505 },
    { upTo: 105775, rate: 0.0915 },
    { upTo: 150000, rate: 0.1116 },
    { upTo: 220000, rate: 0.1216 },
    { upTo: Infinity, rate: 0.1316 },
  ]},
  QC: { name: "Québec", bpa: 18056, brackets: [
    { upTo: 53255, rate: 0.14 },
    { upTo: 106495, rate: 0.19 },
    { upTo: 129590, rate: 0.24 },
    { upTo: Infinity, rate: 0.2575 },
  ]},
  BC: { name: "British Columbia", bpa: 12932, brackets: [
    { upTo: 49279, rate: 0.0506 },
    { upTo: 98560, rate: 0.077 },
    { upTo: 113158, rate: 0.105 },
    { upTo: 137407, rate: 0.1229 },
    { upTo: 186306, rate: 0.147 },
    { upTo: 259829, rate: 0.168 },
    { upTo: Infinity, rate: 0.205 },
  ]},
  AB: { name: "Alberta", bpa: 22323, brackets: [
    { upTo: 60000, rate: 0.08 },
    { upTo: 151234, rate: 0.10 },
    { upTo: 181481, rate: 0.12 },
    { upTo: 241974, rate: 0.13 },
    { upTo: 362961, rate: 0.14 },
    { upTo: Infinity, rate: 0.15 },
  ]},
  MB: { name: "Manitoba", bpa: 15969, brackets: [
    { upTo: 47000, rate: 0.108 },
    { upTo: 100000, rate: 0.1275 },
    { upTo: Infinity, rate: 0.174 },
  ]},
  SK: { name: "Saskatchewan", bpa: 18491, brackets: [
    { upTo: 53463, rate: 0.105 },
    { upTo: 152750, rate: 0.125 },
    { upTo: Infinity, rate: 0.145 },
  ]},
  NS: { name: "Nova Scotia", bpa: 8744, brackets: [
    { upTo: 29590, rate: 0.0879 },
    { upTo: 59180, rate: 0.1495 },
    { upTo: 93000, rate: 0.1667 },
    { upTo: 150000, rate: 0.175 },
    { upTo: Infinity, rate: 0.21 },
  ]},
  NB: { name: "New Brunswick", bpa: 13396, brackets: [
    { upTo: 51306, rate: 0.094 },
    { upTo: 102614, rate: 0.14 },
    { upTo: 190060, rate: 0.16 },
    { upTo: Infinity, rate: 0.195 },
  ]},
  NL: { name: "Newfoundland & Labrador", bpa: 11067, brackets: [
    { upTo: 44192, rate: 0.087 },
    { upTo: 88382, rate: 0.145 },
    { upTo: 157792, rate: 0.158 },
    { upTo: 220910, rate: 0.178 },
    { upTo: 282214, rate: 0.198 },
    { upTo: 564429, rate: 0.208 },
    { upTo: 1128858, rate: 0.213 },
    { upTo: Infinity, rate: 0.218 },
  ]},
  PE: { name: "Prince Edward Island", bpa: 14250, brackets: [
    { upTo: 33328, rate: 0.095 },
    { upTo: 64656, rate: 0.1347 },
    { upTo: 105000, rate: 0.166 },
    { upTo: 140000, rate: 0.1762 },
    { upTo: Infinity, rate: 0.19 },
  ]},
  YT: { name: "Yukon", bpa: 16129, brackets: [
    { upTo: 57375, rate: 0.064 },
    { upTo: 114750, rate: 0.09 },
    { upTo: 177882, rate: 0.109 },
    { upTo: 500000, rate: 0.128 },
    { upTo: Infinity, rate: 0.15 },
  ]},
  NT: { name: "Northwest Territories", bpa: 17842, brackets: [
    { upTo: 51964, rate: 0.059 },
    { upTo: 103930, rate: 0.086 },
    { upTo: 168967, rate: 0.122 },
    { upTo: Infinity, rate: 0.1405 },
  ]},
  NU: { name: "Nunavut", bpa: 19274, brackets: [
    { upTo: 54707, rate: 0.04 },
    { upTo: 109413, rate: 0.07 },
    { upTo: 177881, rate: 0.09 },
    { upTo: Infinity, rate: 0.115 },
  ]},
};

function taxFromBrackets(income: number, brackets: { upTo: number; rate: number }[]) {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const slice = Math.min(income, b.upTo) - lower;
    tax += slice * b.rate;
    lower = b.upTo;
  }
  return tax;
}

const CPP_MAX_PENSIONABLE = 71300;
const CPP_BASIC_EXEMPTION = 3500;
const CPP_RATE = 0.0595;
const EI_MAX_INSURABLE = 65700;
const EI_RATE = 0.0164;

function fmt(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function CalculatorPage() {
  const [income, setIncome] = useState(85000);
  const [rrsp, setRrsp] = useState(0);
  const [province, setProvince] = useState<ProvKey>("ON");

  const result = useMemo(() => {
    const taxable = Math.max(0, income - rrsp);
    const prov = PROVINCES[province];

    const fedGross = taxFromBrackets(taxable, FEDERAL);
    const fedCredit = FEDERAL_BPA * FEDERAL[0].rate;
    const federalTax = Math.max(0, fedGross - fedCredit);

    const provGross = taxFromBrackets(taxable, prov.brackets);
    const provCredit = prov.bpa * prov.brackets[0].rate;
    const provincialTax = Math.max(0, provGross - provCredit);

    const cpp = Math.max(0, Math.min(income, CPP_MAX_PENSIONABLE) - CPP_BASIC_EXEMPTION) * CPP_RATE;
    const ei = Math.min(income, EI_MAX_INSURABLE) * EI_RATE;

    const total = federalTax + provincialTax + cpp + ei;
    const net = income - total;
    const marginalBracket =
      [...FEDERAL].find((b) => taxable <= b.upTo) ?? FEDERAL[FEDERAL.length - 1];
    const provBracket =
      [...prov.brackets].find((b) => taxable <= b.upTo) ?? prov.brackets[prov.brackets.length - 1];
    const marginal = marginalBracket.rate + provBracket.rate;
    const avg = income > 0 ? total / income : 0;

    return { federalTax, provincialTax, cpp, ei, total, net, marginal, avg };
  }, [income, rrsp, province]);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24">
      <div className="flex items-center gap-3">
        <MapleLeaf className="h-7 w-7 text-primary" />
        <p className="text-xs uppercase tracking-widest text-primary">Tax year 2025</p>
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">
        Canadian income tax <span className="italic text-primary">calculator</span>
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        A quick estimate of federal &amp; provincial tax, CPP and EI. For employment income.
        Not tax advice — book a consultation for an accurate picture.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Tax estimate</span>
        <Link to="/rrsp-fhsa" className="rounded-full border border-border px-3 py-1 hover:bg-accent">RRSP / FHSA optimizer →</Link>
        <Link to="/salary-dividend" className="rounded-full border border-border px-3 py-1 hover:bg-accent">Salary vs Dividend →</Link>
        <Link to="/planner" className="rounded-full border border-border px-3 py-1 hover:bg-accent">AI tax plan →</Link>
      </nav>

      <div className="mt-12 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-border bg-card p-6">
          <div>
            <Label htmlFor="income">Annual employment income</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="income" type="number" min={0} step={1000}
                value={income} onChange={(e) => setIncome(Number(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="rrsp">RRSP / FHSA contribution</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="rrsp" type="number" min={0} step={500}
                value={rrsp} onChange={(e) => setRrsp(Number(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label>Province or territory</Label>
            <Select value={province} onValueChange={(v) => setProvince(v as ProvKey)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVINCES) as ProvKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{PROVINCES[k].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-paper p-6 ring-maple">
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Take-home (net)" value={fmt(result.net)} primary />
            <Stat label="Total tax & contributions" value={fmt(result.total)} />
            <Stat label="Federal tax" value={fmt(result.federalTax)} />
            <Stat label={`${PROVINCES[province].name} tax`} value={fmt(result.provincialTax)} />
            <Stat label="CPP" value={fmt(result.cpp)} />
            <Stat label="EI" value={fmt(result.ei)} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
            <Stat label="Marginal rate" value={`${(result.marginal * 100).toFixed(1)}%`} small />
            <Stat label="Average rate" value={`${(result.avg * 100).toFixed(1)}%`} small />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Estimates use 2025 brackets and basic personal amounts. CPP shown is employee portion
            (5.95% on pensionable earnings up to $71,300). Excludes CPP2, dividend &amp; capital gains
            treatment, Québec QPP/QPIP differences, and other credits.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label, value, primary, small,
}: { label: string; value: string; primary?: boolean; small?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={
          (primary ? "text-primary font-display " : "text-foreground font-display ") +
          (small ? "text-xl mt-1" : "text-3xl mt-1")
        }
      >
        {value}
      </div>
    </div>
  );
}
