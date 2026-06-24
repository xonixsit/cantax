import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MapleLeaf } from "@/components/maple-leaf";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Download, FileText, Plus, Trash2, Upload } from "lucide-react";

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

const FILING_TYPES = [
  "Personal T1 return",
  "Corporate T2 return",
  "GST/HST return",
  "Payroll remittance",
  "Cross-border (US/CA)",
  "Other",
];

const CHECKLISTS: Record<string, string[]> = {
  "Personal T1 return": [
    "T4 slips (employment income)",
    "T5/T3 slips (investment income)",
    "RRSP contribution receipts",
    "Medical / donation receipts",
    "Tuition (T2202) if applicable",
    "Rent or property tax statements",
    "Prior-year Notice of Assessment",
  ],
  "Corporate T2 return": [
    "Trial balance & general ledger",
    "Bank statements (full year)",
    "Accounts receivable / payable aging",
    "Fixed asset additions & disposals",
    "Prior-year T2 and NOA",
    "Shareholder loan reconciliation",
  ],
  "GST/HST return": [
    "Sales report for the period",
    "Expense report with GST/HST paid",
    "Prior GST/HST return",
    "Bank reconciliation",
  ],
  "Payroll remittance": [
    "Payroll register for the period",
    "T4 summary YTD",
    "CRA payroll account number",
  ],
  "Cross-border (US/CA)": [
    "T4 / W-2 slips",
    "Foreign tax credit documentation",
    "Treaty residency details",
    "Days-in-country log",
  ],
  Other: [
    "Supporting documents",
    "Prior correspondence with CRA",
  ],
};

function Portal() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [filings, setFilings] = useState<Filing[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
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

  async function deleteFiling(id: string) {
    if (!userId) return;
    if (!confirm("Delete this filing? Documents stay in your library.")) return;
    const { error } = await supabase.from("filings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh(userId);
  }

  async function uploadFiles(files: FileList | File[], filingId: string | null) {
    if (!userId) return;
    const list = Array.from(files);
    if (!list.length) return;
    setUploadingFor(filingId ?? "library");
    let ok = 0;
    for (const file of list) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await supabase.storage.from("client-documents").upload(path, file);
      if (up.error) { toast.error(`${file.name}: ${up.error.message}`); continue; }
      const { error } = await supabase.from("documents").insert({
        user_id: userId, filing_id: filingId, storage_path: path,
        file_name: file.name, mime_type: file.type, size_bytes: file.size,
      });
      if (error) toast.error(`${file.name}: ${error.message}`); else ok++;
    }
    setUploadingFor(null);
    if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""}`);
    refresh(userId);
  }

  async function onUploadInput(e: React.ChangeEvent<HTMLInputElement>, filingId: string | null) {
    if (!e.target.files?.length) return;
    await uploadFiles(e.target.files, filingId);
    e.target.value = "";
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

  async function updateStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "filed") patch.filed_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("filings").update(patch).eq("id", id);
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
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Start a filing
              </Button>
            </DialogTrigger>
            <FilingWizard
              userId={userId}
              onDone={() => { setWizardOpen(false); if (userId) refresh(userId); }}
            />
          </Dialog>
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
        </div>
      </div>

      <section className="mt-10 grid gap-4">
        {filings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No filings yet. Start a guided filing to add details, work through a checklist, and upload documents in one flow.</p>
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
                  {f.notes && <p className="mt-3 text-sm whitespace-pre-wrap">{f.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v)}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([v, m]) => (
                        <SelectItem key={v} value={v}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="cursor-pointer">
                    <input type="file" multiple className="hidden"
                      onChange={(e) => onUploadInput(e, f.id)} disabled={uploadingFor !== null} />
                    <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4 mr-1" />
                      {uploadingFor === f.id ? "Uploading…" : "Add docs"}
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
            <input type="file" multiple className="hidden"
              onChange={(e) => onUploadInput(e, null)} disabled={uploadingFor !== null} />
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

/* ------------------------------ Wizard ------------------------------ */

const STEPS = ["Details", "Checklist", "Documents", "Review"] as const;

function FilingWizard({ userId, onDone }: { userId: string | null; onDone: () => void }) {
  const now = new Date().getFullYear();
  const [step, setStep] = useState(0);
  const [tax_year, setYear] = useState(now - 1);
  const [filing_type, setType] = useState(FILING_TYPES[0]);
  const [due_date, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const items = useMemo(() => CHECKLISTS[filing_type] ?? CHECKLISTS.Other, [filing_type]);
  const checkedCount = items.filter((i) => checked[i]).length;

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function submit() {
    if (!userId) return;
    setBusy(true);
    const checklistNote = items.length
      ? `Checklist:\n${items.map((i) => `${checked[i] ? "[x]" : "[ ]"} ${i}`).join("\n")}`
      : "";
    const fullNotes = [notes.trim(), checklistNote].filter(Boolean).join("\n\n");

    const { data: created, error } = await supabase.from("filings").insert({
      user_id: userId,
      tax_year,
      filing_type,
      status: "intake",
      due_date: due_date || null,
      notes: fullNotes || null,
    }).select("id").single();

    if (error || !created) { setBusy(false); return toast.error(error?.message ?? "Could not create filing"); }

    if (files.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const up = await supabase.storage.from("client-documents").upload(path, file);
        if (!up.error) {
          await supabase.from("documents").insert({
            user_id: userId, filing_id: created.id, storage_path: path,
            file_name: file.name, mime_type: file.type, size_bytes: file.size,
          });
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
    }

    setBusy(false);
    toast.success("Filing started — we'll take it from here.");
    onDone();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Start a filing</DialogTitle>
        <DialogDescription>
          A guided intake — give us the details, check off what you've got, and upload it all in one go.
        </DialogDescription>
      </DialogHeader>

      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 flex-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${
              i < step ? "bg-primary text-primary-foreground border-primary"
                : i === step ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            }`}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={i === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {i < STEPS.length - 1 && <span className="flex-1 h-px bg-border" />}
          </li>
        ))}
      </ol>

      <div className="min-h-[280px] pt-2">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tax year</Label>
                <Input type="number" value={tax_year} min={2000} max={now + 1}
                  onChange={(e) => setYear(parseInt(e.target.value || "0", 10))} className="mt-2" />
              </div>
              <div>
                <Label>Due date (optional)</Label>
                <Input type="date" value={due_date} onChange={(e) => setDue(e.target.value)} className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Filing type</Label>
              <Select value={filing_type} onValueChange={(v) => { setType(v); setChecked({}); }}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Anything we should know? (optional)</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                className="mt-2" maxLength={1000}
                placeholder="Life changes, new income sources, special circumstances…" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tick what you have ready. Missing items? No problem — you can add them later.
            </p>
            <ul className="rounded-xl border border-border divide-y divide-border">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-3 p-3">
                  <Checkbox id={item} checked={!!checked[item]}
                    onCheckedChange={(v) => setChecked((c) => ({ ...c, [item]: !!v }))} />
                  <label htmlFor={item} className="text-sm cursor-pointer flex-1">{item}</label>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{checkedCount} of {items.length} ready</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block cursor-pointer rounded-xl border border-dashed border-border p-8 text-center hover:bg-accent/40">
              <input type="file" multiple className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm">Click to add files (you can select many at once)</p>
              <p className="text-xs text-muted-foreground">PDF, images, spreadsheets — anything relevant</p>
            </label>
            {files.length > 0 && (
              <ul className="rounded-xl border border-border divide-y divide-border max-h-48 overflow-auto">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between p-2 text-sm">
                    <span className="truncate flex-1 mr-2">{f.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">{(f.size / 1024).toFixed(0)} KB</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border p-4 space-y-1">
              <p><span className="text-muted-foreground">Filing:</span> {filing_type} · {tax_year}</p>
              {due_date && <p><span className="text-muted-foreground">Due:</span> {due_date}</p>}
              <p><span className="text-muted-foreground">Checklist:</span> {checkedCount} of {items.length} ready</p>
              <p><span className="text-muted-foreground">Documents:</span> {files.length} file{files.length === 1 ? "" : "s"}</p>
              {notes && <p className="pt-1 whitespace-pre-wrap"><span className="text-muted-foreground">Notes:</span> {notes}</p>}
            </div>
            {busy && files.length > 0 && (
              <div>
                <Progress value={progress} />
                <p className="mt-2 text-xs text-muted-foreground">Uploading documents… {progress}%</p>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0 || busy}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="bg-primary hover:bg-primary/90">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={busy} className="bg-primary hover:bg-primary/90">
            {busy ? "Submitting…" : "Submit filing"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
