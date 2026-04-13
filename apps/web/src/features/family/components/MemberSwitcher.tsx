'use client';

import type { FamilyMember } from '../types';
import { useActiveMember } from '../contexts/ActiveMemberContext';

interface MemberSwitcherProps {
    members: FamilyMember[];
}

export function MemberSwitcher({ members }: MemberSwitcherProps) {
    const { activeMemberId, setActiveMember } = useActiveMember();

    if (members.length === 0) return null;

    return (
        <div className="flex items-center gap-1">
            <span className="text-caption text-text-tertiary mr-1">身份</span>
            {members.map((m) => {
                const isActive = m.id === activeMemberId;
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveMember(m)}
                        title={m.name}
                        className={[
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium transition-all duration-150',
                            isActive
                                ? 'bg-white/15 text-text-primary shadow-sm ring-1 ring-white/10'
                                : 'text-text-tertiary hover:text-text-secondary hover:bg-white/8',
                        ].join(' ')}
                    >
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: m.avatar_color }}
                        />
                        {m.name}
                    </button>
                );
            })}
        </div>
    );
}
