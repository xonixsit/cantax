import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Maple & Ledger" },
      { name: "description", content: "Reach Maple & Ledger by phone, email or at one of our four Canadian offices." },
      { property: "og:title", content: "Contact — Maple & Ledger" },
      { property: "og:description", content: "Reach Maple & Ledger by phone, email or at one of our four Canadian offices." },
    ],
  }),
  component: Contact,
});

const offices = [
  ["Toronto", "120 Adelaide St W, Suite 2400", "(416) 555-0142"],
  ["Vancouver", "666 Burrard St, Suite 1800", "(604) 555-0188"],
  ["Montréal", "1250 René-Lévesque O, Suite 2200", "(514) 555-0166"],
  ["Calgary", "421 7th Ave SW, Suite 1500", "(403) 555-0117"],
];

function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-20 pb-24">
      <p className="text-xs uppercase tracking-widest text-primary">Contact</p>
      <h1 className="mt-2 font-display text-5xl md:text-6xl">Let's talk taxes.</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        <div className="flex gap-4">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <div className="font-display text-lg">Email</div>
            <a href="mailto:hello@mapleledger.ca" className="text-sm text-muted-foreground hover:text-primary">
              hello@mapleledger.ca
            </a>
          </div>
        </div>
        <div className="flex gap-4">
          <Phone className="h-6 w-6 text-primary" />
          <div>
            <div className="font-display text-lg">Phone</div>
            <a href="tel:+18005550199" className="text-sm text-muted-foreground hover:text-primary">
              1-800-555-0199
            </a>
          </div>
        </div>
        <div className="flex gap-4">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <div className="font-display text-lg">Hours</div>
            <p className="text-sm text-muted-foreground">Mon–Fri 8am–7pm ET<br />Sat 10am–4pm during tax season</p>
          </div>
        </div>
      </div>

      <h2 className="mt-20 font-display text-3xl text-spruce">Offices</h2>
      <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {offices.map(([city, addr, phone]) => (
          <div key={city} className="bg-card p-6">
            <h3 className="font-display text-xl">{city}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{addr}</p>
            <p className="mt-2 text-sm text-primary">{phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
