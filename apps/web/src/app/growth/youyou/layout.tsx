'use client';

import { YouyouSubNav } from '@/features/youyou';

export default function YouyouLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <YouyouSubNav />
            {children}
        </>
    );
}
