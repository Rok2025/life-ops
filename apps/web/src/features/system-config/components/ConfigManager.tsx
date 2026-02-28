'use client';

import { ConfigScopeSection } from './ConfigScopeSection';
import type { ConfigItem, ScopeMeta } from '../types';

interface ConfigManagerProps {
    scopes: ScopeMeta[];
    initialData: Record<string, ConfigItem[]>;
}

export default function ConfigManager({ scopes, initialData }: ConfigManagerProps) {
    return (
        <div className="space-y-section">
            {scopes.map(meta => (
                <ConfigScopeSection
                    key={meta.scope}
                    meta={meta}
                    initialItems={initialData[meta.scope] ?? []}
                />
            ))}
        </div>
    );
}
