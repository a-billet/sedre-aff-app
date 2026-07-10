import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GrillePonderationsEditor } from "../../components/grille-ponderations-editor";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditGrillePage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_super_admin) redirect("/?error=access_denied");

    // Charger la version
    const { data: version, error: versionError } = await supabase
        .from("grille_versions")
        .select("*")
        .eq("id", id)
        .single();

    if (versionError || !version) notFound();

    if (version.statut !== "brouillon") {
        return (
            <div className="max-w-4xl mx-auto p-8 space-y-4">
                <Link
                    href="/admin"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Retour
                </Link>
                <p className="text-muted-foreground">
                    Cette version ({version.statut}) ne peut plus être modifiée.
                </p>
            </div>
        );
    }

    // Charger les critères et pondérations
    const { data: criteres } = await supabase
        .from("criteres")
        .select("*")
        .order("ordre");

    const { data: ponderations } = await supabase
        .from("grille_ponderations")
        .select("*")
        .eq("grille_version_id", id);

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Retour
                </Link>
                <div>
                    <h1 className="text-xl font-bold">
                        Modifier : {version.description ?? `Brouillon ${id.slice(0, 8)}`}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Modifiez les poids et seuils de chaque critère. Les analyses déjà
                        finalisées ne seront pas recalculées.
                    </p>
                </div>
            </div>

            {(!criteres || criteres.length === 0) && (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Aucun critère défini. Ajoutez des critères dans la table{" "}
                    <code>criteres</code> via Supabase Studio.
                </div>
            )}

            {criteres && criteres.length > 0 && (
                <GrillePonderationsEditor
                    grilleId={id}
                    criteres={criteres}
                    ponderations={ponderations ?? []}
                />
            )}
        </div>
    );
}
