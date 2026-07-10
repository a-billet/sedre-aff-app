"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "magic_link" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mode, setMode] = useState<Mode>("magic_link");
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
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">SEDRE</CardTitle>
        <CardDescription>Outil de faisabilité foncière — connexion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className={`text-sm rounded-md p-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </p>
        )}
        <form onSubmit={mode === "magic_link" ? handleMagicLink : handlePasswordLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {mode === "password" && (
            <div className="space-y-1">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion…" : mode === "magic_link" ? "Recevoir un lien de connexion" : "Se connecter"}
          </Button>
        </form>
        <button type="button" onClick={() => setMode(mode === "magic_link" ? "password" : "magic_link")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          {mode === "magic_link" ? "Connexion par mot de passe" : "Connexion par lien e-mail"}
        </button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<Card className="w-full max-w-sm"><CardContent className="py-12 text-center text-muted-foreground text-sm">Chargement…</CardContent></Card>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
