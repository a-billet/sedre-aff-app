"use client";

import { useState, useTransition } from "react";
import { sauvegarderCriteres } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Database } from "@/lib/supabase/types";

type CritereRow = Database["public"]["Tables"]["criteres"]["Row"];

interface CritereState {
    poids: number;
    options: { valeur: string; score: number }[];
    /** Jeton de verrouillage optimiste — mis à jour après chaque sauvegarde */
    updated_at: string;
}

function buildInitialState(criteres: CritereRow[]): Record<string, CritereState> {
    const state: Record<string, CritereState> = {};
    for (const c of criteres) {
        const seuils = c.seuils as
            | { type?: string; options?: { valeur: string; score: number }[] }
            | null;
        state[c.id] = {
            poids: Number(c.poids),
            options:
                seuils?.type === "qualitatif" && seuils.options
                    ? seuils.options
                    : [],
            updated_at: c.updated_at,
        };
    }
    return state;
}

function groupByCategorie(criteres: CritereRow[]) {
    const map = new Map<string, CritereRow[]>();
    for (const c of criteres) {
        const list = map.get(c.categorie) ?? [];
        list.push(c);
        map.set(c.categorie, list);
    }
    return map;
}

export function GrilleCriteresEditor({ criteres }: { criteres: CritereRow[] }) {
    const [states, setStates] = useState<Record<string, CritereState>>(() =>
        buildInitialState(criteres),
    );
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    function updatePoids(critereId: string, value: string) {
        const num = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => ({
            ...prev,
            [critereId]: { ...prev[critereId], poids: num },
        }));
        setSaved(false);
    }

    function updateOptionScore(critereId: string, index: number, value: string) {
        const score = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => {
            const opts = [...(prev[critereId]?.options ?? [])];
            opts[index] = { ...opts[index], score };
            return { ...prev, [critereId]: { ...prev[critereId], options: opts } };
        });
        setSaved(false);
    }

    function handleSauvegarder() {
        if (
            !confirm(
                "Appliquer les modifications sur la grille de notation active ?\n\n" +
                "Cette action met à jour immédiatement les poids et seuils utilisés " +
                "lors des prochains calculs de score.",
            )
        )
            return;

        startTransition(async () => {
            setError(null);
            setSaved(false);

            const mises_a_jour = criteres.map((c) => {
                const st = states[c.id]!;
                const seuils =
                    c.type_saisie === "qualitatif"
                        ? { type: "qualitatif", options: st.options }
                        : {};
                return {
                    id: c.id,
                    poids: st.poids,
                    seuils,
                    updated_at: st.updated_at,
                };
            });

            const result = await sauvegarderCriteres(mises_a_jour);

            if (!result.ok) {
                setError(result.message);
                return;
            }

            // Mettre à jour les jetons optimistes avec les nouvelles valeurs DB
            setStates((prev) => {
                const next = { ...prev };
                for (const [id, updated_at] of Object.entries(result.updatedAts)) {
                    if (next[id]) next[id] = { ...next[id], updated_at };
                }
                return next;
            });
            setSaved(true);
        });
    }

    const byCategorie = groupByCategorie(criteres);

    return (
        <div className="space-y-6">
            {Array.from(byCategorie.entries()).map(([categorie, cats]) => (
                <Card key={categorie}>
                    <CardHeader>
                        <CardTitle className="text-base">{categorie}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cats.map((critere) => {
                            const state = states[critere.id];
                            if (!state) return null;
                            return (
                                <div
                                    key={critere.id}
                                    className="border rounded-md p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{critere.libelle}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {critere.type_saisie}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Poids
                                            </span>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={state.poids}
                                                onChange={(e) =>
                                                    updatePoids(critere.id, e.target.value)
                                                }
                                                className="w-20 h-8 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {critere.type_saisie === "qualitatif" &&
                                        state.options.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Scores par option
                                                </p>
                                                <div className="grid gap-1.5">
                                                    {state.options.map((opt, i) => (
                                                        <div
                                                            key={opt.valeur}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <span className="text-xs w-36 truncate">
                                                                {opt.valeur}
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={opt.score}
                                                                onChange={(e) =>
                                                                    updateOptionScore(
                                                                        critere.id,
                                                                        i,
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="w-20 h-7 text-xs"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            <div className="flex items-center gap-4 pt-2 pb-8">
                <Button onClick={handleSauvegarder} disabled={isPending}>
                    {isPending ? "Sauvegarde…" : "Sauvegarder"}
                </Button>
                {saved && (
                    <p className="text-sm text-green-600">
                        Modifications enregistrées.
                    </p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}
