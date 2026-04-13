import type { MemberBrief } from '../types';

interface MemberAvatarProps {
    member: MemberBrief;
    size?: 'sm' | 'md';
    className?: string;
}

const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
};

export function MemberAvatar({ member, size = 'sm', className }: MemberAvatarProps) {
    return (
        <span
            className={[
                'inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 shadow-sm',
                sizeMap[size],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            style={{ backgroundColor: member.avatar_color }}
            title={member.name}
        >
            {member.name.charAt(0)}
        </span>
    );
}

interface MemberAvatarGroupProps {
    members: MemberBrief[];
    size?: 'sm' | 'md';
}

export function MemberAvatarGroup({ members, size = 'sm' }: MemberAvatarGroupProps) {
    if (members.length === 0) {
        return (
            <span className="text-caption text-text-tertiary italic">待分配</span>
        );
    }

    return (
        <span className="inline-flex -space-x-1.5">
            {members.map((m) => (
                <MemberAvatar
                    key={m.id}
                    member={m}
                    size={size}
                    className="ring-2 ring-card-bg"
                />
            ))}
        </span>
    );
}
