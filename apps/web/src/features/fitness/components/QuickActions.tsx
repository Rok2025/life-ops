import { Plus } from 'lucide-react';
import type { WeeklyStats } from '../types';

interface QuickActionsProps {
    stats: WeeklyStats;
    onAddWorkout?: () => void;
}

export function QuickActions({ stats, onAddWorkout }: QuickActionsProps) {
    return (
        <section>
            <button
                type="button"
                onClick={onAddWorkout}
                className="card p-card border-2 border-dashed border-accent/50 hover:border-accent hover:bg-accent/5 transition-all group block w-full text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} className="text-accent" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">添加训练记录</h3>
                        <p className="text-sm text-text-secondary">记录今天的训练内容</p>
                    </div>
                </div>
            </button>
        </section>
    );
}
