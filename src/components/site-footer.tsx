import { Link } from "@tanstack/react-router";
import { MapleLeaf } from "./maple-leaf";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <MapleLeaf className="h-6 w-6 text-primary" />
            <span className="font-display text-lg">Maple &amp; Ledger</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Trusted Canadian tax advisors for individuals and businesses. CRA-compliant filing,
            cross-border returns, and year-round planning.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Licensed in all 10 provinces and 3 territories. Member, CPA Canada.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-spruce">Services</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/services" className="hover:text-primary">Personal T1</Link></li>
            <li><Link to="/services" className="hover:text-primary">Corporate T2</Link></li>
            <li><Link to="/services" className="hover:text-primary">GST/HST</Link></li>
            <li><Link to="/services" className="hover:text-primary">Cross-border (US)</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-spruce">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/calculator" className="hover:text-primary">Tax calculator</Link></li>
            <li><Link to="/book" className="hover:text-primary">Book a consult</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Maple &amp; Ledger Tax Advisors Inc.</span>
          <span>Toronto · Vancouver · Montréal · Calgary</span>
        </div>
      </div>
    </footer>
  );
}
