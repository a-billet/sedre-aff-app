import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GrilleCriteresEditor } from "./components/grille-criteres-editor";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Double vérification super-admin côté page (en plus du middleware)
    const { data: profile } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_super_admin) redirect("/?error=access_denied");

    const { data: criteria, error } = await supabase
        .from("scoring_criteria")
        .select("*, scoring_options(id, key, label, score, sort_order)")
        .order("phase")
        .order("sort_order");

    if (error) {
        return (
            <div className="p-8 text-red-600">
                Erreur lors du chargement des critères : {error.message}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(46,75,133,0.56),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))]">
            <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_60%)]" />
            <div className="absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* Header */}
                <header className="relative z-10 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                            <Image src="/logo.jpg" alt="Logo SEDRE" width={50} height={50} priority style={{ width: 'auto', height: 'auto' }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.32em] text-primary/80">SEDRE</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                Administration
                            </h1>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-white/80 px-4 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-white hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Retour aux études
                    </Link>
                </header>

                {/* Content */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                            <Settings className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/75">Super-Admin</p>
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">Grille de notation</h2>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Modifiez les poids et seuils de notation. Cliquez sur &quot;Sauvegarder&quot; pour appliquer les changements sur la grille active.
                    </p>

                    {!criteria || criteria.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-border/70 bg-white/75 p-8 text-center text-sm text-muted-foreground shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
                            Aucun critère défini. Ajoutez des critères via Supabase Studio.
                        </div>
                    ) : (
                        <div className="rounded-[24px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
                            <GrilleCriteresEditor criteria={criteria} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
