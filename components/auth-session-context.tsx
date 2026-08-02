'use client';

import { createContext, useContext } from 'react';

type AuthSessionContextValue = {
    userEmail?: string;
    isAdmin: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue>({
    userEmail: undefined,
    isAdmin: false,
});

type AuthSessionProviderProps = {
    children: React.ReactNode;
    value: AuthSessionContextValue;
};

export function AuthSessionProvider({ children, value }: AuthSessionProviderProps) {
    return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
    return useContext(AuthSessionContext);
}
