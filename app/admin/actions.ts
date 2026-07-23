"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type MiseAJourOption = {
  id: string;
  score: number;
};

type MiseAJourCritere = {
  id: string;
  weight: number;
  config?: unknown;
  options?: MiseAJourOption[];
};

type SauvegarderResult = { ok: true } | { ok: false; message: string };

/**
 * Sauvegarde les poids, configs et scores d'options de tous les critères.
 * Met à jour scoring_criteria.weight / config et scoring_options.score.
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

  for (const { id, weight, config, options } of mises_a_jour) {
    // Mettre à jour le critère (poids + config)
    const updatePayload: Record<string, unknown> = { weight };
    if (config !== undefined) updatePayload.config = config;

    const { error: criteriaError } = await supabase
      .from("scoring_criteria")
      .update(updatePayload)
      .eq("id", id);

    if (criteriaError) {
      return {
        ok: false,
        message: `Erreur sur critère ${id} : ${criteriaError.message}`,
      };
    }

    // Mettre à jour le score de chaque option
    if (options && options.length > 0) {
      for (const opt of options) {
        const { error: optError } = await supabase
          .from("scoring_options")
          .update({ score: opt.score })
          .eq("id", opt.id);

        if (optError) {
          return {
            ok: false,
            message: `Erreur sur option ${opt.id} : ${optError.message}`,
          };
        }
      }
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}
