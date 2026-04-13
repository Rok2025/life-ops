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

    const activeMember =
        members.find((m) => m.id === activeMemberId) ?? null;

    // If stored id doesn't match any member, clear it
    useEffect(() => {
        if (activeMemberId && members.length > 0 && !activeMember) {
            localStorage.removeItem(STORAGE_KEY);
            setActiveMemberId(null);
        }
    }, [activeMemberId, members, activeMember]);

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
            value={{ activeMemberId, activeMember, setActiveMember, clearActiveMember }}
        >
            {children}
        </ActiveMemberContext.Provider>
    );
}

export function useActiveMember() {
    return useContext(ActiveMemberContext);
}
