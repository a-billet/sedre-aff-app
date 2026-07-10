import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PublishGrilleButton } from "./components/publish-grille-button";
import { CreateDraftButton } from "./components/create-draft-button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

function statutLabel(statut: string) {
    switch (statut) {
        case "active":
            return { label: "Active", variant: "default" } as const;
        case "brouillon":
            return { label: "Brouillon", variant: "secondary" } as const;
        case "archivee":
            return { label: "Archivée", variant: "outline" } as const;
        default:
            return { label: statut, variant: "outline" } as const;
    }
}

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Vérification super-admin (double check côté page en plus du middleware)
    const { data: profile } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_super_admin) redirect("/?error=access_denied");

    const { data: versions, error } = await supabase
        .from("grille_versions")
        .select("id, statut, description, published_at, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <div className="p-8 text-red-600">
                Erreur lors du chargement des versions : {error.message}
            </div>
        );
    }

    const hasDraft = versions?.some((v) => v.statut === "brouillon");

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Super-Admin — Grille de notation</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gérez les versions de la grille de notation. Une seule version peut
                        être active à la fois.
                    </p>
                </div>
                {!hasDraft && <CreateDraftButton />}
            </div>

            {versions?.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Aucune version de grille. Créez un brouillon pour commencer.
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {versions?.map((version) => {
                    const { label, variant } = statutLabel(version.statut);
                    return (
                        <Card key={version.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={variant}>{label}</Badge>
                                        <CardTitle className="text-base font-medium">
                                            {version.description ?? `Version ${version.id.slice(0, 8)}`}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {version.statut === "brouillon" && (
                                            <>
                                                <Link
                                                    href={`/admin/grilles/${version.id}`}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    Modifier
                                                </Link>
                                                <PublishGrilleButton grilleId={version.id} />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <CardDescription className="text-xs">
                                    Créée le{" "}
                                    {new Date(version.created_at).toLocaleDateString("fr-FR")}
                                    {version.published_at &&
                                        ` · Publiée le ${new Date(version.published_at).toLocaleDateString("fr-FR")}`}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
