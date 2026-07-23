"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";

type Mode = "magic_link" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [next, router, supabase.auth]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Un lien de connexion vous a été envoyé par e-mail." });
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: "Identifiants incorrects." });
    } else {
      router.replace(next);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo + brand */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.3)] ring-1 ring-black/5">
          <Image src="/logo.jpg" alt="Logo SEDRE" width={64} height={64} priority className="rounded-2xl" />
        </div>
        <div className="text-center">
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">Analyses de faisabilité foncière</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour accéder à vos études</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
        {/* Mode tabs */}
        {/* <div className="mb-6 flex rounded-xl border border-border/60 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => { setMode("password"); setMessage(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "password" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Mot de passe
          </button>
          <button
            type="button"
            onClick={() => { setMode("magic_link"); setMessage(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === "magic_link" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Lien magique
          </button>
        </div> */}

        {message && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={mode === "magic_link" ? handleMagicLink : handlePasswordLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {mode === "password" && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="mt-2 w-full h-11 rounded-xl gap-2 shadow-[0_8px_24px_-8px_rgba(34,197,94,0.5)] hover:shadow-[0_12px_32px_-8px_rgba(34,197,94,0.6)]"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {mode === "magic_link" ? "Recevoir un lien" : "Se connecter"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(46,75,133,0.45),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.99))] flex items-center justify-center p-4">
      {/* decorative blobs */}
      <div className="absolute left-1/4 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-16 h-56 w-56 translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/80 p-8 text-center text-sm text-muted-foreground shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          Chargement…
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
