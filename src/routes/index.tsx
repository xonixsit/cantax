import { createFileRoute, Link } from "@tanstack/react-router";
import { MapleLeaf } from "@/components/maple-leaf";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileText, Building2, Globe2, Calculator } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maple & Ledger — Canadian Tax Consultancy" },
      { name: "description", content: "CRA-compliant tax filing, planning and advisory for Canadian individuals and businesses." },
      { property: "og:title", content: "Maple & Ledger — Canadian Tax Consultancy" },
      { property: "og:description", content: "CRA-compliant tax filing, planning and advisory for Canadian individuals and businesses." },
    ],
  }),
  component: Home,
});

const services = [
  { icon: FileText, title: "Personal T1", desc: "Returns, RRSP & TFSA planning, capital gains, rental income." },
  { icon: Building2, title: "Corporate T2", desc: "Incorporation, year-end filings, dividends vs salary strategy." },
  { icon: Calculator, title: "GST/HST & Payroll", desc: "Registration, monthly/quarterly remittance, source deductions." },
  { icon: Globe2, title: "Cross-border (US)", desc: "1040, FBAR, treaty positions for dual-status Canadians." },
];

const stats = [
  { k: "8,400+", v: "Returns filed" },
  { k: "$14.2M", v: "Refunds secured" },
  { k: "13", v: "Provinces & territories" },
  { k: "98%", v: "Client retention" },
];

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grain absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-24 md:grid-cols-12 md:pt-28">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-3 py-1 text-xs text-spruce">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              CRA-registered · 2026 tax season open
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
              Canadian tax,
              <br />
              <span className="text-primary italic">done properly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              From a first T1 to a multi-province corporation, our advisors guide you through every
              CRA form, deadline and deduction — so your filing is accurate, optimized and on time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/book">
                  Book a free 20-min call <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/calculator">Try the tax calculator</Link>
              </Button>
            </div>
            <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
              {["NETFILE-certified", "Audit-ready documentation", "Year-round advisory", "Bilingual: EN / FR"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-spruce" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5">
            <div className="relative rounded-2xl border border-border bg-card p-6 ring-maple">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Sample T1 summary
                </span>
                <MapleLeaf className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-3 font-mono text-sm">
                <Row label="Employment income (line 10100)" value="$ 92,400.00" />
                <Row label="RRSP deduction (line 20800)" value="− 8,500.00" />
                <Row label="Net income (line 23600)" value="$ 83,900.00" />
                <Row label="Federal tax" value="$ 12,418.50" />
                <Row label="Ontario tax" value="$ 5,742.10" />
                <div className="border-t border-dashed pt-3">
                  <Row label="Refund" value="$ 2,184.20" emphasis />
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-spruce/5 p-3 text-xs text-spruce">
                Optimized via spousal split & FHSA contribution — saved $1,820 versus baseline.
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative. Actual results vary by province and personal situation.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-paper">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-6 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v}>
              <div className="font-display text-3xl text-spruce md:text-4xl">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">What we do</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Tax services for every chapter.</h2>
          </div>
          <Link to="/services" className="text-sm text-spruce hover:text-primary">
            All services →
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <s.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-spruce text-spruce-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-xs uppercase tracking-widest text-gold">How it works</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">Three steps from slips to filed.</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              ["01", "Upload", "Send T4s, receipts and prior returns through our encrypted portal."],
              ["02", "Review", "Your advisor models scenarios — RRSP, FHSA, spousal split, dividends."],
              ["03", "File", "NETFILE-submitted to CRA with a clear summary and audit-ready archive."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <div className="font-display text-5xl text-gold">{n}</div>
                <h3 className="mt-4 font-display text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-spruce-foreground/80">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <MapleLeaf className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-6 font-display text-4xl md:text-5xl">
          Ready for a clearer tax picture?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Book a no-obligation 20-minute consultation. We'll review your situation and tell you
          exactly where you stand — before you commit.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/book">Book consultation</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/calculator">Estimate my tax</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? "text-primary font-semibold text-base" : "text-foreground"}>{value}</span>
    </div>
  );
}
