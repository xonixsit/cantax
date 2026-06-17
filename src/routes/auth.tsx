import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapleLeaf } from "@/components/maple-leaf";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Maple & Ledger" },
      { name: "description", content: "Access your secure Maple & Ledger client portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/portal" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal`,
          data: { full_name: fullName },
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Check your inbox to confirm your email.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/portal" });
    }
  }

  async function onGoogle() {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/portal`,
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="mx-auto max-w-md px-6 pt-20 pb-24">
      <Link to="/" className="inline-flex items-center gap-2">
        <MapleLeaf className="h-7 w-7 text-primary" />
        <span className="font-display text-xl">Maple<span className="text-primary">&amp;</span>Ledger</span>
      </Link>
      <h1 className="mt-8 font-display text-4xl">
        {mode === "signin" ? "Welcome back." : "Create your account."}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Sign in to manage filings and upload documents."
          : "Set up secure access to your tax filings."}
      </p>

      <div className="mt-8 space-y-3">
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
          Continue with Google
        </Button>
        <div className="relative py-2 text-center text-xs uppercase tracking-wide text-muted-foreground">
          <span className="bg-background px-2 relative z-10">or</span>
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" required value={fullName}
              onChange={(e) => setFullName(e.target.value)} className="mt-2" />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)} className="mt-2" />
        </div>
        <Button type="submit" disabled={busy} size="lg"
          className="w-full bg-primary hover:bg-primary/90">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          className="text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
