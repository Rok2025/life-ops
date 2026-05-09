'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { FamilyMember } from '../types';

const STORAGE_KEY = 'family_active_member';

interface ActiveMemberContextValue {
    activeMemberId: string | null;
    activeMember: FamilyMember | null;
    setActiveMember: (member: FamilyMember) => void;
    clearActiveMember: () => void;
}

const ActiveMemberContext = createContext<ActiveMemberContextValue>({
    activeMemberId: null,
    activeMember: null,
    setActiveMember: () => {},
    clearActiveMember: () => {},
});

export function ActiveMemberProvider({
    members,
    children,
}: {
    members: FamilyMember[];
    children: ReactNode;
}) {
    const [activeMemberId, setActiveMemberId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(STORAGE_KEY);
    });

    const storedMemberIsStale = Boolean(
        activeMemberId && members.length > 0 && !members.some((m) => m.id === activeMemberId),
    );
    const resolvedActiveMemberId = storedMemberIsStale ? null : activeMemberId;
    const activeMember = members.find((m) => m.id === resolvedActiveMemberId) ?? null;

    // If stored id doesn't match any member, clear it
    useEffect(() => {
        if (storedMemberIsStale) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [storedMemberIsStale]);

    const setActiveMember = useCallback((member: FamilyMember) => {
        localStorage.setItem(STORAGE_KEY, member.id);
        setActiveMemberId(member.id);
    }, []);

    const clearActiveMember = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setActiveMemberId(null);
    }, []);

    return (
        <ActiveMemberContext.Provider
            value={{ activeMemberId: resolvedActiveMemberId, activeMember, setActiveMember, clearActiveMember }}
        >
            {children}
        </ActiveMemberContext.Provider>
    );
}

export function useActiveMember() {
    return useContext(ActiveMemberContext);
}
