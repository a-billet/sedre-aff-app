"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Publie une version brouillon :
 * 1. Archive la version active actuelle (s'il y en a une)
 * 2. Passe la version brouillon en statut "active"
 *
 * Tout se fait dans la même transaction logique — les deux UPDATE
 * doivent réussir ou l'opération est annulée.
 */
export async function publierGrille(grilleId: string) {
  const supabase = await createClient();

  // Vérification de droits côté serveur
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error("Accès refusé");

  // Archiver la version active actuelle
  const { error: archiveError } = await supabase
    .from("grille_versions")
    .update({ statut: "archivee", updated_at: new Date().toISOString() })
    .eq("statut", "active");

  if (archiveError)
    throw new Error(`Archivage échoué : ${archiveError.message}`);

  // Publier le brouillon
  const { error: publishError } = await supabase
    .from("grille_versions")
    .update({
      statut: "active",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", grilleId)
    .eq("statut", "brouillon"); // protection contre une double publication

  if (publishError)
    throw new Error(`Publication échouée : ${publishError.message}`);

  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * Crée un nouveau brouillon en dupliquant la version active (ou vide si aucune).
 */
export async function creerBrouillon(description: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error("Accès refusé");

  // Créer la nouvelle version
  const { data: newVersion, error: versionError } = await supabase
    .from("grille_versions")
    .insert({
      statut: "brouillon",
      description,
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError || !newVersion)
    throw new Error(`Création échouée : ${versionError?.message}`);

  // Dupliquer les pondérations de la version active (si elle existe)
  const { data: activeVersion } = await supabase
    .from("grille_versions")
    .select("id")
    .eq("statut", "active")
    .single();

  if (activeVersion) {
    const { data: ponderations } = await supabase
      .from("grille_ponderations")
      .select("critere_id, poids, seuils")
      .eq("grille_version_id", activeVersion.id);

    if (ponderations && ponderations.length > 0) {
      const toInsert = ponderations.map((p) => ({
        grille_version_id: newVersion.id,
        critere_id: p.critere_id,
        poids: p.poids,
        seuils: p.seuils,
      }));

      const { error: pondError } = await supabase
        .from("grille_ponderations")
        .insert(toInsert);

      if (pondError)
        throw new Error(
          `Duplication des pondérations échouée : ${pondError.message}`,
        );
    }
  }

  revalidatePath("/admin");
  redirect(`/admin/grilles/${newVersion.id}`);
}

/**
 * Met à jour le poids et les seuils d'un critère dans un brouillon.
 */
export async function updatePonderation(
  grilleId: string,
  critereId: string,
  poids: number,
  seuils: unknown,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error("Accès refusé");

  // S'assurer que la version est bien un brouillon
  const { data: version } = await supabase
    .from("grille_versions")
    .select("statut")
    .eq("id", grilleId)
    .single();

  if (!version || version.statut !== "brouillon")
    throw new Error("Seul un brouillon peut être modifié");

  const { error } = await supabase.from("grille_ponderations").upsert({
    grille_version_id: grilleId,
    critere_id: critereId,
    poids,
    seuils: seuils as never,
  });

  if (error) throw new Error(`Mise à jour échouée : ${error.message}`);

  revalidatePath(`/admin/grilles/${grilleId}`);
}
