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
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/types";

type ScoringCriteriaRow = Database["public"]["Tables"]["scoring_criteria"]["Row"];
type ScoringOptionRow = Database["public"]["Tables"]["scoring_options"]["Row"];

type CriteriaWithOptions = ScoringCriteriaRow & {
    scoring_options: ScoringOptionRow[];
};

interface CritereState {
    weight: number;
    options: { id: string; key: string; label: string; score: number }[];
    config: Record<string, unknown> | null;
    commentaire: string;
}

const PHASE_LABELS: Record<number, string> = {
    1: "Phase 1 — Analyse initiale",
    2: "Phase 2 — Analyse détaillée",
    3: "Phase 3 — Analyse financière",
};

function buildInitialState(criteria: CriteriaWithOptions[]): Record<string, CritereState> {
    const state: Record<string, CritereState> = {};
    for (const c of criteria) {
        const config = (c.config as Record<string, unknown> | null) ?? null;
        const commentaire = typeof config?.commentaire === "string" ? config.commentaire : "";

        state[c.id] = {
            weight: Number(c.weight),
            options: [...c.scoring_options]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((o) => ({ id: o.id, key: o.key, label: o.label, score: Number(o.score) })),
            config,
            commentaire,
        };
    }
    return state;
}

function groupByPhase(criteria: CriteriaWithOptions[]) {
    const map = new Map<number, CriteriaWithOptions[]>();
    for (const c of criteria) {
        const list = map.get(c.phase) ?? [];
        list.push(c);
        map.set(c.phase, list);
    }
    return map;
}

export function GrilleCriteresEditor({ criteria }: { criteria: CriteriaWithOptions[] }) {
    const [states, setStates] = useState<Record<string, CritereState>>(() =>
        buildInitialState(criteria),
    );
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    function updateWeight(criteriaId: string, value: string) {
        const num = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => ({
            ...prev,
            [criteriaId]: { ...prev[criteriaId], weight: num },
        }));
        setSaved(false);
    }

    function updateOptionScore(criteriaId: string, index: number, value: string) {
        const score = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => {
            const opts = [...(prev[criteriaId]?.options ?? [])];
            opts[index] = { ...opts[index], score };
            return { ...prev, [criteriaId]: { ...prev[criteriaId], options: opts } };
        });
        setSaved(false);
    }

    function updateCheckboxMalus(criteriaId: string, value: string) {
        const malus = Math.min(100, Math.max(0, Number(value) || 0));
        setStates((prev) => ({
            ...prev,
            [criteriaId]: {
                ...prev[criteriaId],
                config: { ...(prev[criteriaId]?.config ?? {}), malus },
            },
        }));
        setSaved(false);
    }

    function updateCommentaire(criteriaId: string, value: string) {
        setStates((prev) => ({
            ...prev,
            [criteriaId]: {
                ...prev[criteriaId],
                commentaire: value,
            },
        }));
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

            const mises_a_jour = criteria.map((c) => {
                const st = states[c.id]!;
                const config = {
                    ...((st.config ?? {}) as Record<string, unknown>),
                    commentaire: st.commentaire,
                };

                return {
                    id: c.id,
                    weight: st.weight,
                    config,
                    options: (c.type === "select" || c.type === "additive")
                        ? st.options.map((o) => ({ id: o.id, score: o.score }))
                        : [],
                };
            });

            const result = await sauvegarderCriteres(mises_a_jour);

            if (!result.ok) {
                setError(result.message);
                return;
            }

            setSaved(true);
        });
    }

    const byPhase = groupByPhase(criteria);

    return (
        <div className="space-y-6">
            {Array.from(byPhase.entries())
                .sort(([a], [b]) => a - b)
                .map(([phase, items]) => (
                    <Card key={phase}>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {PHASE_LABELS[phase] ?? `Phase ${phase}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((critere) => {
                                const state = states[critere.id];
                                if (!state) return null;
                                return (
                                    <div
                                        key={critere.id}
                                        className="border rounded-md p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{critere.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {!critere.active && (
                                                        <span className="ml-2 text-yellow-600">(inactif)</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Options pour select / additive */}
                                        {(critere.type === "select" || critere.type === "additive") &&
                                            state.options.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Scores par option
                                                    </p>
                                                    <div className="grid gap-1.5">
                                                        {state.options.map((opt, i) => (
                                                            <div
                                                                key={opt.key}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="text-xs w-40 truncate">
                                                                    {opt.label}
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

                                        {/* Malus pour checkbox */}
                                        {critere.type === "checkbox" && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-40">
                                                    Malus si coché (0–100)
                                                </span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={
                                                        typeof state.config?.malus === "number"
                                                            ? state.config.malus
                                                            : 0
                                                    }
                                                    onChange={(e) =>
                                                        updateCheckboxMalus(critere.id, e.target.value)
                                                    }
                                                    className="w-20 h-7 text-xs"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Commentaire
                                            </p>
                                            <Textarea
                                                value={state.commentaire}
                                                onChange={(e) => updateCommentaire(critere.id, e.target.value)}
                                                placeholder="Ajoutez un commentaire pour ce critère..."
                                                rows={2}
                                                className="min-h-20 text-sm"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}

            <div className="flex items-center justify-end gap-4 pt-2 pb-8">
                {saved && (
                    <p className="text-sm text-green-600">
                        Modifications enregistrées.
                    </p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={handleSauvegarder} disabled={isPending}>
                    {isPending ? "Sauvegarde…" : "Sauvegarder"}
                </Button>
            </div>
        </div>
    );
}
