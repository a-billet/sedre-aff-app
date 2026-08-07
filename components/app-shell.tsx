'use client';

import { useAuthSession } from '@/components/auth-session-context';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type AppShellProps = {
    children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
    const { userEmail, isAdmin } = useAuthSession();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    if (pathname === '/login') {
        return <>{children}</>;
    }

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
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                Études de faisabilité foncière
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => setProfileOpen((o) => !o)}
                                className="flex size-11 items-center justify-center rounded-xl border border-border/60 bg-slate-50/80 text-muted-foreground shadow-sm transition-colors hover:bg-white hover:text-foreground hover:cursor-pointer"
                                aria-label="Profil utilisateur"
                            >
                                <UserCircle className="size-5" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-72 rounded-2xl border border-border/60 bg-white/95 p-1.5 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
                                    <div className="px-3 py-2.5">
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Connecté en tant que</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-foreground">{userEmail ?? '—'}</p>
                                    </div>
                                    {isAdmin && (
                                        <>
                                            <div className="my-1 h-px bg-border/60" />
                                            <a
                                                href="/admin"
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:cursor-pointer"
                                            >
                                                <Settings className="size-4" />
                                                Administration
                                            </a>
                                        </>
                                    )}
                                    <div className="my-1 h-px bg-border/60" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            void handleLogout();
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive hover:cursor-pointer"
                                    >
                                        <LogOut className="size-4" />
                                        Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
