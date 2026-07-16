"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/types";

type MiseAJourCritere = {
  id: string;
  poids: number;
  seuils: unknown;
  /** updated_at lu côté client — sert de jeton de verrouillage optimiste */
  updated_at: string;
};

type SauvegarderResult =
  | { ok: true; updatedAts: Record<string, string> }
  | { ok: false; message: string };

/**
 * Sauvegarde les poids et seuils de tous les critères en une seule passe.
 *
 * Verrouillage optimiste : chaque UPDATE est conditionné à l'égalité de
 * updated_at entre le client et la base. Si un critère a été modifié entre
 * le chargement de la page et la sauvegarde, l'opération entière est rejetée.
 */
export async function sauvegarderCriteres(
  mises_a_jour: MiseAJourCritere[],
): Promise<SauvegarderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: profile } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_super_admin) return { ok: false, message: "Accès refusé" };

  const now = new Date().toISOString();
  const updatedAts: Record<string, string> = {};

  for (const { id, poids, seuils, updated_at } of mises_a_jour) {
    const { data, error } = await supabase
      .from("criteres")
      .update({ poids, seuils: seuils as Json, updated_at: now })
      .eq("id", id)
      .eq("updated_at", updated_at) // verrouillage optimiste
      .select("id, updated_at");

    if (error)
      return {
        ok: false,
        message: `Erreur sur critère ${id} : ${error.message}`,
      };

    if (!data || data.length === 0) {
      return {
        ok: false,
        message:
          "Cette grille a été modifiée entre-temps par un autre administrateur. " +
          "Rechargez la page avant de sauvegarder.",
      };
    }

    updatedAts[id] = data[0].updated_at;
  }

  revalidatePath("/admin");
  return { ok: true, updatedAts };
}
