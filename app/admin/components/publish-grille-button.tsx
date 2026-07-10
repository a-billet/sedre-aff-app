"use client";

import { useState } from "react";
import { publierGrille } from "../actions";
import { Button } from "@/components/ui/button";

export function PublishGrilleButton({ grilleId }: { grilleId: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handlePublish() {
        if (
            !confirm(
                "Publier cette version ? La version actuellement active sera archivée.",
            )
        )
            return;

        setLoading(true);
        setError(null);

        try {
            await publierGrille(grilleId);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur inconnue");
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                size="sm"
                onClick={handlePublish}
                disabled={loading}
                variant="default"
            >
                {loading ? "Publication…" : "Publier"}
            </Button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
