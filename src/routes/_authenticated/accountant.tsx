import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapleLeaf } from "@/components/maple-leaf";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accountant")({
  head: () => ({ meta: [{ title: "Accountant portal — Maple & Ledger" }] }),
  component: AccountantPortal,
});

type Filing = {
  id: string; user_id: string; tax_year: number; filing_type: string;
  status: string; due_date: string | null; filed_date: string | null; notes: string | null;
};
type DocRow = {
  id: string; user_id: string; file_name: string; storage_path: string;
  created_at: string; filing_id: string | null;
};
type Profile = { id: string; full_name: string | null };

const STATUSES = ["intake", "in_review", "awaiting", "filed", "closed"];
const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  intake:    { label: "Intake",       tone: "bg-muted text-foreground" },
  in_review: { label: "In review",    tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" },
  awaiting:  { label: "Awaiting client", tone: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200" },
  filed:     { label: "Filed",        tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" },
  closed:    { label: "Closed",       tone: "bg-muted text-muted-foreground" },
};

function AccountantPortal() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = useCallback(async () => {
    const [{ data: f }, { data: d }, { data: p }] = await Promise.all([
      supabase.from("filings").select("*").order("tax_year", { ascending: false }),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
    ]);
    setFilings((f ?? []) as Filing[]);
    setDocs((d ?? []) as DocRow[]);
    const map: Record<string, Profile> = {};
    (p ?? []).forEach((row) => { map[row.id] = row as Profile; });
    setProfiles(map);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/auth" }); return; }
      const [staff, admin] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "staff" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      const ok = !!staff.data || !!admin.data;
      setAllowed(ok);
      if (ok) await load();
      setChecking(false);
    })();
  }, [navigate, load]);

  async function updateStatus(id: string, status: string) {
    const patch: { status: string; filed_date?: string | null } = { status };
    if (status === "filed") patch.filed_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("filings").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  }

  async function downloadDoc(d: DocRow) {
    const { data, error } = await supabase.storage
      .from("client-documents").createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  if (checking) {
    return <div className="mx-auto max-w-6xl px-6 py-20 text-muted-foreground">Verifying credentials…</div>;
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-3xl">Accountants only</h1>
        <p className="mt-3 text-muted-foreground">
          This area is restricted to Maple &amp; Ledger staff. If you're a client, head to your portal.
        </p>
        <Button asChild className="mt-6 bg-primary hover:bg-primary/90">
          <Link to="/portal">Open my portal</Link>
        </Button>
      </div>
    );
  }

  const filtered = filterStatus === "all" ? filings : filings.filter((f) => f.status === filterStatus);
  const stats = STATUSES.map((s) => ({ s, count: filings.filter((f) => f.status === s).length }));

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapleLeaf className="h-4 w-4 text-primary" /> Accountant portal
          </div>
          <h1 className="mt-2 font-display text-4xl">Client filings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filings.length} total · {Object.keys(profiles).length} clients</p>
        </div>
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(({ s, count }) => (
          <div key={s} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{STATUS_LABEL[s].label}</div>
            <div className="font-display text-3xl mt-1">{count}</div>
          </div>
        ))}
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Filing</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Docs</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No filings match this filter.</td></tr>
            )}
            {filtered.map((f) => {
              const client = profiles[f.user_id];
              const filingDocs = docs.filter((d) => d.filing_id === f.id);
              return (
                <tr key={f.id} className="border-t border-border align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium">{client?.full_name || "Client"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{f.user_id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-4">{f.filing_type}</td>
                  <td className="px-4 py-4">{f.tax_year}</td>
                  <td className="px-4 py-4">
                    <Badge className={STATUS_LABEL[f.status]?.tone ?? ""}>{STATUS_LABEL[f.status]?.label ?? f.status}</Badge>
                    <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v)}>
                      <SelectTrigger className="mt-2 h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s].label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-4">
                    {filingDocs.length === 0 ? (
                      <span className="text-xs text-muted-foreground">none</span>
                    ) : (
                      <ul className="space-y-1">
                        {filingDocs.map((d) => (
                          <li key={d.id} className="flex items-center gap-2 text-xs">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[140px]">{d.file_name}</span>
                            <button onClick={() => downloadDoc(d)} className="text-primary hover:underline">
                              <Download className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-xs">{f.notes ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
