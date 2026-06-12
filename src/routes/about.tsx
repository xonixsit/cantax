import { createFileRoute } from "@tanstack/react-router";
import { MapleLeaf } from "@/components/maple-leaf";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Maple & Ledger" },
      { name: "description", content: "A Canadian tax practice built on accuracy, advocacy and year-round availability." },
      { property: "og:title", content: "About — Maple & Ledger" },
      { property: "og:description", content: "A Canadian tax practice built on accuracy, advocacy and year-round availability." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-20 pb-24">
      <MapleLeaf className="h-10 w-10 text-primary" />
      <h1 className="mt-6 font-display text-5xl md:text-6xl">
        Tax advice that <span className="italic text-primary">talks back.</span>
      </h1>
      <p className="mt-8 text-lg text-muted-foreground">
        Maple &amp; Ledger was founded in 2014 by three CPAs who were tired of seeing Canadians
        leave money on the table — and tired of practices that disappeared between April and
        February. We built a firm that's reachable year-round, that explains its reasoning,
        and that treats CRA correspondence with the seriousness it deserves.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-3">
        {[
          ["Accuracy first", "Every return is reviewed by a second CPA before NETFILE submission."],
          ["Advocacy", "We respond to every CRA letter on your behalf — no extra invoice for a 30-day reply."],
          ["Plain language", "You'll always understand why a number is on your return."],
        ].map(([t, d]) => (
          <div key={t}>
            <h3 className="font-display text-xl text-spruce">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-paper p-8">
        <h2 className="font-display text-3xl">Our team</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {[
            ["Élise Tremblay, CPA", "Managing Partner · Montréal", "20 years in cross-border individual tax."],
            ["Daniel Okafor, CPA, CA", "Partner · Toronto", "Corporate tax & owner-managed businesses."],
            ["Priya Sandhu, CPA", "Partner · Vancouver", "GST/HST, real estate and self-employed income."],
          ].map(([n, r, b]) => (
            <div key={n}>
              <div className="aspect-square rounded-xl bg-spruce/10" />
              <h4 className="mt-3 font-display text-lg">{n}</h4>
              <p className="text-xs text-primary">{r}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
