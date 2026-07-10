"use client";

import { useState, useTransition } from "react";
import { updatePonderation } from "../actions";
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
type PonderationRow =
    Database["public"]["Tables"]["grille_ponderations"]["Row"];

interface Props {
    grilleId: string;
    criteres: CritereRow[];
    ponderations: PonderationRow[];
}

interface CritereEditorState {
    poids: number;
    // seuils simplifié : liste d'options qualitatives { valeur, score }
    options: { valeur: string; score: number }[];
    saved: boolean;
    error: string | null;
}

function buildInitialState(
    criteres: CritereRow[],
    ponderations: PonderationRow[],
): Record<string, CritereEditorState> {
    const state: Record<string, CritereEditorState> = {};
    for (const critere of criteres) {
        const pond = ponderations.find((p) => p.critere_id === critere.id);
        const seuils = pond?.seuils as
            | { type: string; options?: { valeur: string; score: number }[] }
            | null;

        state[critere.id] = {
            poids: pond ? Number(pond.poids) : 0,
            options:
                seuils?.type === "qualitatif" && seuils.options ? seuils.options : [],
            saved: false,
            error: null,
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

export function GrillePonderationsEditor({ grilleId, criteres, ponderations }: Props) {
    const [states, setStates] = useState<Record<string, CritereEditorState>>(
        () => buildInitialState(criteres, ponderations),
    );
    const [isPending, startTransition] = useTransition();

    function updatePoids(critereId: string, value: string) {
        const num = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => ({
            ...prev,
            [critereId]: { ...prev[critereId], poids: num, saved: false },
        }));
    }

    function updateOptionScore(
        critereId: string,
        index: number,
        value: string,
    ) {
        const score = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => {
            const opts = [...(prev[critereId]?.options ?? [])];
            opts[index] = { ...opts[index], score };
            return {
                ...prev,
                [critereId]: { ...prev[critereId], options: opts, saved: false },
            };
        });
    }

    function saveCritere(critereId: string, typeSaisie: string) {
        const state = states[critereId];
        if (!state) return;

        const seuils =
            typeSaisie === "qualitatif"
                ? { type: "qualitatif", options: state.options }
                : {};

        startTransition(async () => {
            try {
                await updatePonderation(grilleId, critereId, state.poids, seuils);
                setStates((prev) => ({
                    ...prev,
                    [critereId]: { ...prev[critereId], saved: true, error: null },
                }));
            } catch (e) {
                setStates((prev) => ({
                    ...prev,
                    [critereId]: {
                        ...prev[critereId],
                        error: e instanceof Error ? e.message : "Erreur",
                    },
                }));
            }
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
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Poids</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={state.poids}
                                                    onChange={(e) => updatePoids(critere.id, e.target.value)}
                                                    className="w-20 h-8 text-sm"
                                                />
                                                <span className="text-xs text-muted-foreground">%</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={state.saved ? "outline" : "default"}
                                                disabled={isPending}
                                                onClick={() =>
                                                    saveCritere(critere.id, critere.type_saisie)
                                                }
                                            >
                                                {state.saved ? "✓ Sauvegardé" : "Sauvegarder"}
                                            </Button>
                                        </div>
                                    </div>

                                    {critere.type_saisie === "qualitatif" &&
                                        state.options.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {state.options.map((opt, i) => (
                                                    <div
                                                        key={opt.valeur}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="text-xs flex-1 text-muted-foreground truncate">
                                                            {opt.valeur}
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={opt.score}
                                                            onChange={(e) =>
                                                                updateOptionScore(critere.id, i, e.target.value)
                                                            }
                                                            className="w-20 h-7 text-xs"
                                                        />
                                                        <span className="text-xs text-muted-foreground">/100</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    {state.error && (
                                        <p className="text-xs text-red-600">{state.error}</p>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
