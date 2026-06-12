import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapleLeaf } from "@/components/maple-leaf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a consultation — Maple & Ledger" },
      { name: "description", content: "Schedule a free 20-minute consultation with a Canadian tax advisor." },
      { property: "og:title", content: "Book a consultation — Maple & Ledger" },
      { property: "og:description", content: "Schedule a free 20-minute consultation with a Canadian tax advisor." },
    ],
  }),
  component: BookPage,
});

const SERVICES = [
  "Personal T1 return",
  "Corporate T2 return",
  "GST/HST & payroll",
  "Cross-border (US/CA)",
  "CRA audit / review",
  "Tax planning",
  "Bookkeeping",
  "Other",
];

const PROVINCES = ["ON","QC","BC","AB","MB","SK","NS","NB","NL","PE","YT","NT","NU"] as const;

function BookPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    client_type: "individual" as "individual" | "business" | "both",
    service: SERVICES[0],
    preferred_date: "",
    province: "ON",
    message: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("consultations").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      client_type: form.client_type,
      service: form.service,
      preferred_date: form.preferred_date || null,
      province: form.province,
      message: form.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit your request", { description: error.message });
      return;
    }
    toast.success("Request received", {
      description: "An advisor will reach out within one business day.",
    });
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-16 pb-24">
      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <MapleLeaf className="h-8 w-8 text-primary" />
          <h1 className="mt-4 font-display text-5xl">Book a free consult.</h1>
          <p className="mt-4 text-muted-foreground">
            20 minutes, no obligation. Tell us a bit about your situation and we'll match you
            with the right advisor.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex gap-3"><span className="text-primary">·</span> Reply within 1 business day</li>
            <li className="flex gap-3"><span className="text-primary">·</span> Confidential — encrypted in transit & at rest</li>
            <li className="flex gap-3"><span className="text-primary">·</span> Bilingual advisors (EN / FR)</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="lg:col-span-3 space-y-5 rounded-2xl border border-border bg-card p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" required minLength={2} value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email}
                onChange={(e) => update("email", e.target.value)} className="mt-2" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={form.phone}
                onChange={(e) => update("phone", e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>I'm a…</Label>
              <Select value={form.client_type} onValueChange={(v) => update("client_type", v as typeof form.client_type)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business owner</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Service</Label>
              <Select value={form.service} onValueChange={(v) => update("service", v)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Province</Label>
              <Select value={form.province} onValueChange={(v) => update("province", v)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="preferred_date">Preferred date (optional)</Label>
            <Input id="preferred_date" type="date" value={form.preferred_date}
              onChange={(e) => update("preferred_date", e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="message">What would you like to discuss?</Label>
            <Textarea id="message" rows={4} maxLength={2000} value={form.message}
              onChange={(e) => update("message", e.target.value)} className="mt-2"
              placeholder="A few words about your situation: sources of income, business structure, deadlines…" />
          </div>
          <Button type="submit" disabled={submitting} size="lg"
            className="w-full bg-primary hover:bg-primary/90">
            {submitting ? "Submitting…" : "Request consultation"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to be contacted about your inquiry.
          </p>
        </form>
      </div>
    </div>
  );
}
