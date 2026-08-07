"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useAuthSession } from '@/components/auth-session-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getGeneralAnalysisDefaults,
    saveGeneralAnalysisDefaultCriterion,
} from '@/lib/storage';

export default function ParametresGenerauxPage() {
    const { isAdmin } = useAuthSession();
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const defaults = await getGeneralAnalysisDefaults();
                if (!active) return;
                setValue(defaults.miseEnEtatSols === null ? '' : String(defaults.miseEnEtatSols));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, []);

    const parsedValue = useMemo(() => {
        if (value.trim() === '') return null;
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : null;
    }, [value]);

    const handleSave = () => {
        if (!isAdmin) {
            setSaveMessage('Seuls les super-administrateurs peuvent modifier ce paramètre.');
            return;
        }

        startTransition(() => {
            void saveGeneralAnalysisDefaultCriterion(parsedValue)
                .then(() => setSaveMessage('Critère enregistré.'))
                .catch((error) => {
                    setSaveMessage(error instanceof Error ? error.message : 'Erreur de sauvegarde.');
                });
        });
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(46,75,133,0.56),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))]">
            <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_60%)]" />
            <div className="absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="relative z-10 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                            <Image src="/logo.jpg" alt="Logo SEDRE" width={50} height={50} priority style={{ width: 'auto', height: 'auto' }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.32em] text-primary/80">SEDRE</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Paramètres généraux</h1>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-white/80 px-4 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-white hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Retour aux études
                    </Link>
                </header>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                            <Settings className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/75">Configuration globale</p>
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">Paramètre réutilisable</h2>
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
                        <div className="max-w-2xl space-y-4">
                            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                                Le montant saisi ici sera proposé automatiquement dans chaque nouvelle analyse.
                                Laisser le champ vide conserve une valeur non définie.
                            </p>

                            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground" htmlFor="miseEnEtatSols">
                                        Mise en état des sols (€)
                                    </label>
                                    <Input
                                        id="miseEnEtatSols"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="Aucune valeur par défaut"
                                        disabled={isLoading || !isAdmin}
                                        className="h-11 rounded-xl bg-white/80"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isLoading || isPending || !isAdmin}
                                    className="h-11 rounded-xl px-4"
                                >
                                    <Save className="size-4" />
                                    Enregistrer
                                </Button>

                                {!isAdmin && (
                                    <p className="text-sm text-muted-foreground">
                                        Lecture seule pour votre compte. La modification est réservée aux super-administrateurs.
                                    </p>
                                )}
                            </div>

                            {saveMessage && (
                                <p className="text-sm text-muted-foreground">
                                    {saveMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}