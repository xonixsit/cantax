import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapleLeaf } from "@/components/maple-leaf";
import { toast } from "sonner";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "Client portal — Maple & Ledger" }] }),
  component: Portal,
});

type Filing = {
  id: string; tax_year: number; filing_type: string; status: string;
  due_date: string | null; filed_date: string | null; notes: string | null;
};
type DocRow = {
  id: string; file_name: string; mime_type: string | null;
  size_bytes: number | null; storage_path: string; created_at: string;
  filing_id: string | null;
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  intake:     { label: "Intake",      tone: "bg-muted text-foreground" },
  in_review:  { label: "In review",   tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" },
  awaiting:   { label: "Awaiting you", tone: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200" },
  filed:      { label: "Filed",       tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" },
  closed:     { label: "Closed",      tone: "bg-muted text-muted-foreground" },
};

function Portal() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [filings, setFilings] = useState<Filing[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string) => {
    const [{ data: f }, { data: d }] = await Promise.all([
      supabase.from("filings").select("*").eq("user_id", uid).order("tax_year", { ascending: false }),
      supabase.from("documents").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    setFilings((f ?? []) as Filing[]);
    setDocs((d ?? []) as DocRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/auth" }); return; }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      await refresh(data.user.id);
      setLoading(false);
    })();
  }, [navigate, refresh]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function createFiling(form: { tax_year: number; filing_type: string; notes: string }) {
    if (!userId) return;
    const { error } = await supabase.from("filings").insert({
      user_id: userId,
      tax_year: form.tax_year,
      filing_type: form.filing_type,
      status: "intake",
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Filing created");
    setNewOpen(false);
    refresh(userId);
  }

  async function deleteFiling(id: string) {
    if (!userId) return;
    if (!confirm("Delete this filing? Documents stay in your library.")) return;
    const { error } = await supabase.from("filings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh(userId);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>, filingId: string | null) {
    if (!userId || !e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingFor(filingId ?? "library");
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const up = await supabase.storage.from("client-documents").upload(path, file);
    if (up.error) { setUploadingFor(null); return toast.error(up.error.message); }
    const { error } = await supabase.from("documents").insert({
      user_id: userId, filing_id: filingId, storage_path: path,
      file_name: file.name, mime_type: file.type, size_bytes: file.size,
    });
    setUploadingFor(null);
    e.target.value = "";
    if (error) return toast.error(error.message);
    toast.success("Uploaded");
    refresh(userId);
  }

  async function downloadDoc(d: DocRow) {
    const { data, error } = await supabase.storage
      .from("client-documents").createSignedUrl(d.storage_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  async function deleteDoc(d: DocRow) {
    if (!confirm(`Delete ${d.file_name}?`)) return;
    await supabase.storage.from("client-documents").remove([d.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    if (userId) refresh(userId);
  }

  if (loading) {
    return <div className="mx-auto max-w-6xl px-6 py-20 text-muted-foreground">Loading your portal…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapleLeaf className="h-4 w-4 text-primary" /> Client portal
          </div>
          <h1 className="mt-2 font-display text-4xl">Your filings.</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> New filing
              </Button>
            </DialogTrigger>
            <NewFilingDialog onCreate={createFiling} />
          </Dialog>
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
        </div>
      </div>

      <section className="mt-10 grid gap-4">
        {filings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No filings yet. Create one to track its status and attach documents.</p>
          </div>
        )}
        {filings.map((f) => {
          const filingDocs = docs.filter((d) => d.filing_id === f.id);
          const s = STATUS_LABEL[f.status] ?? STATUS_LABEL.intake;
          return (
            <article key={f.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl">{f.filing_type}</h2>
                    <Badge className={s.tone}>{s.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tax year {f.tax_year}
                    {f.due_date && <> · Due {f.due_date}</>}
                    {f.filed_date && <> · Filed {f.filed_date}</>}
                  </p>
                  {f.notes && <p className="mt-3 text-sm">{f.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" className="hidden"
                      onChange={(e) => onUpload(e, f.id)} disabled={uploadingFor !== null} />
                    <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4 mr-1" />
                      {uploadingFor === f.id ? "Uploading…" : "Upload"}
                    </span>
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => deleteFiling(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {filingDocs.length > 0 && (
                <ul className="mt-5 divide-y divide-border border-t border-border">
                  {filingDocs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{d.file_name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => downloadDoc(d)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDoc(d)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Document library</h3>
          <label className="cursor-pointer">
            <input type="file" className="hidden"
              onChange={(e) => onUpload(e, null)} disabled={uploadingFor !== null} />
            <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
              <Upload className="h-4 w-4 mr-1" />
              {uploadingFor === "library" ? "Uploading…" : "Upload"}
            </span>
          </label>
        </div>
        {docs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="mt-4 rounded-2xl border border-border divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-4 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{d.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                      {d.size_bytes != null && <> · {(d.size_bytes / 1024).toFixed(0)} KB</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => downloadDoc(d)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteDoc(d)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const FILING_TYPES = [
  "Personal T1 return",
  "Corporate T2 return",
  "GST/HST return",
  "Payroll remittance",
  "Cross-border (US/CA)",
  "Other",
];

function NewFilingDialog({ onCreate }: { onCreate: (f: { tax_year: number; filing_type: string; notes: string }) => void }) {
  const now = new Date().getFullYear();
  const [tax_year, setYear] = useState(now - 1);
  const [filing_type, setType] = useState(FILING_TYPES[0]);
  const [notes, setNotes] = useState("");

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New filing</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Tax year</Label>
          <Input type="number" value={tax_year} min={2000} max={now + 1}
            onChange={(e) => setYear(parseInt(e.target.value || "0", 10))} className="mt-2" />
        </div>
        <div>
          <Label>Filing type</Label>
          <Select value={filing_type} onValueChange={setType}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            className="mt-2" maxLength={1000} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({ tax_year, filing_type, notes })}
          className="bg-primary hover:bg-primary/90">Create filing</Button>
      </DialogFooter>
    </DialogContent>
  );
}
