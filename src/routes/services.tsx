import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileText, Building2, Calculator, Globe2, Briefcase, ShieldCheck, PiggyBank, Receipt } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Maple & Ledger" },
      { name: "description", content: "Personal, corporate, GST/HST, payroll and cross-border tax services across Canada." },
      { property: "og:title", content: "Services — Maple & Ledger" },
      { property: "og:description", content: "Personal, corporate, GST/HST, payroll and cross-border tax services across Canada." },
    ],
  }),
  component: ServicesPage,
});

const groups = [
  {
    heading: "For individuals",
    items: [
      { icon: FileText, title: "Personal T1 returns", price: "from $149", desc: "Employment, investment, rental and self-employment income with all credits and deductions." },
      { icon: PiggyBank, title: "RRSP, TFSA & FHSA planning", price: "from $220", desc: "Contribution room, withdrawal strategy, spousal RRSP, Home Buyers' Plan." },
      { icon: Globe2, title: "Cross-border (US/CA)", price: "from $480", desc: "1040, FBAR, FATCA, treaty positions, foreign tax credits and dual-status returns." },
      { icon: ShieldCheck, title: "CRA audit representation", price: "hourly", desc: "Notice review, response drafting and appeals up to the Tax Court of Canada." },
    ],
  },
  {
    heading: "For businesses",
    items: [
      { icon: Building2, title: "Corporate T2 returns", price: "from $899", desc: "CCPC small business deduction, GIFI, capital cost allowance and inter-corporate transfers." },
      { icon: Receipt, title: "GST/HST & PST filing", price: "from $79/mo", desc: "Registration, ITC review, monthly or quarterly remittance, voluntary disclosures." },
      { icon: Briefcase, title: "Payroll & T4/T5 slips", price: "from $39/mo", desc: "Source deductions, ROEs, year-end slip preparation and CRA reconciliation." },
      { icon: Calculator, title: "Bookkeeping & advisory", price: "custom", desc: "QuickBooks/Xero cleanup, monthly close, dividend/salary strategy and forecasting." },
    ],
  },
];

function ServicesPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <p className="text-xs uppercase tracking-widest text-primary">Services</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl max-w-3xl">
          Everything you need for Canadian tax — under one roof.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Transparent pricing, dedicated advisors, and CRA-compliant work delivered on time.
        </p>
      </section>

      {groups.map((g) => (
        <section key={g.heading} className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="font-display text-3xl text-spruce">{g.heading}</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {g.items.map((it) => (
              <article key={it.title} className="bg-card p-7">
                <div className="flex items-start justify-between gap-4">
                  <it.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  <span className="rounded-full bg-paper px-3 py-1 text-xs text-spruce">{it.price}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-4xl">Not sure which service fits?</h2>
        <p className="mt-3 text-muted-foreground">Tell us about your situation and we'll recommend the right path — for free.</p>
        <Button asChild size="lg" className="mt-6 bg-primary hover:bg-primary/90">
          <Link to="/book">Book a consultation</Link>
        </Button>
      </section>
    </div>
  );
}
