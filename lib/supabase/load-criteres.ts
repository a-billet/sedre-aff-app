import type { CritereConfig } from "@/lib/scoring/types";
import { createClient } from "@/lib/supabase/server";

/** Type minimal pour le résultat de la requête imbriquée Supabase. */
type CriteriaRow = {
  id: string;
  phase: number;
  key: string;
  label: string;
  type: string;
  weight: number;
  config: unknown;
  sort_order: number;
  active: boolean;
  scoring_options: Array<{
    key: string;
    label: string;
    score: number;
    sort_order: number;
  }>;
};

/**
 * Charge tous les critères actifs depuis Supabase côté serveur.
 * Retourne un tableau vide en cas d'erreur réseau.
 */
export async function loadCriteres(): Promise<CritereConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scoring_criteria")
    .select("*, scoring_options(id, key, label, score, sort_order)")
    .eq("active", true)
    .order("phase")
    .order("sort_order");

  if (error || !data) return [];

  return (data as unknown as CriteriaRow[]).map((c) => {
    const config = (c.config as Record<string, unknown> | null) ?? null;
    const commentaire =
      typeof config?.commentaire === "string" ? config.commentaire : undefined;

    return {
      id: c.id,
      phase: c.phase as 1 | 2 | 3,
      key: c.key,
      label: c.label,
      type: c.type as CritereConfig["type"],
      weight: Number(c.weight),
      config,
      commentaire,
      sort_order: c.sort_order,
      active: c.active,
      options: (c.scoring_options ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({
          key: o.key,
          label: o.label,
          score: Number(o.score),
          sort_order: o.sort_order,
        })),
    };
  });
}
