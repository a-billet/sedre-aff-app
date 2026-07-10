"use client";

import { useState } from "react";
import { creerBrouillon } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateDraftButton() {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await creerBrouillon(description);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur inconnue");
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <Button onClick={() => setOpen(true)} variant="default">
                Créer un brouillon
            </Button>
        );
    }

    return (
        <form onSubmit={handleCreate} className="flex items-end gap-2">
            <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Révision poids marché Q1 2025"
                    required
                    className="w-72"
                />
            </div>
            <Button type="submit" disabled={loading}>
                {loading ? "Création…" : "Créer"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loading}
            >
                Annuler
            </Button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
    );
}
