'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        const syncSession = async (nextSession?: Session | null) => {
            const currentSession = nextSession ?? (await supabase.auth.getSession()).data.session;

            if (!isActive) return;

            if (!currentSession) {
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.getUser(currentSession.access_token);

            if (!isActive) return;

            if (error) {
                console.warn('Invalid persisted Supabase session, clearing local auth state.', error);
                await supabase.auth.signOut();

                if (!isActive) return;

                setSession(null);
                setUser(null);
                setLoading(false);
                router.push('/login');
                return;
            }

            setSession(currentSession);
            setUser(data.user);
            setLoading(false);
        };

        void syncSession();

        // 2. 监听会话变更
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setLoading(false);
                router.push('/login');
                return;
            }

            void syncSession(session);
        });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, [router]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
