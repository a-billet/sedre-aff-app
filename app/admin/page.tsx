import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GrilleCriteresEditor } from "./components/grille-criteres-editor";

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

    const { data: criteres, error } = await supabase
        .from("criteres")
        .select("*")
        .order("ordre");

    if (error) {
        return (
            <div className="p-8 text-red-600">
                Erreur lors du chargement des critères : {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Super-Admin — Grille de notation</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Modifiez les poids et seuils de notation. Cliquez sur "Sauvegarder"
                    pour appliquer les changements sur la grille active.
                </p>
            </div>

            {!criteres || criteres.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Aucun critère défini. Ajoutez des critères via Supabase Studio.
                </div>
            ) : (
                <GrilleCriteresEditor criteres={criteres} />
            )}
        </div>
    );
}
