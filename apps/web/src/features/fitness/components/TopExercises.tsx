import { TrendingUp } from 'lucide-react';
import type { WorkoutsByDate } from '../types';
import { CATEGORY_CONFIG } from '../types';

interface TopExercisesProps {
    workoutsByDate: WorkoutsByDate[];
}

interface ExerciseAgg {
    name: string;
    category: string;
    count: number;        // 出现次数（多少次训练包含该动作）
    totalVolume: number;  // 总负荷 (weight × sets × reps)
}

export function TopExercises({ workoutsByDate }: TopExercisesProps) {
    // 聚合所有动作
    const exerciseMap = new Map<string, ExerciseAgg>();

    for (const dayGroup of workoutsByDate) {
        for (const session of dayGroup.sessions) {
            for (const ex of session.exercises) {
                const existing = exerciseMap.get(ex.name);
                const volume = ex.weight * ex.sets * ex.reps;
                if (existing) {
                    existing.count += 1;
                    existing.totalVolume += volume;
                } else {
                    exerciseMap.set(ex.name, {
                        name: ex.name,
                        category: ex.category,
                        count: 1,
                        totalVolume: volume,
                    });
                }
            }
        }
    }

    const top5 = [...exerciseMap.values()]
        .sort((a, b) => b.count - a.count || b.totalVolume - a.totalVolume)
        .slice(0, 5);

    if (top5.length === 0) return null;

    const maxCount = top5[0].count;

    return (
        <section className="card p-3">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-accent" />
                <h3 className="text-sm font-medium text-text-secondary">常练动作 Top {top5.length}</h3>
            </div>
            <div className="space-y-2">
                {top5.map((ex, i) => {
                    const config = CATEGORY_CONFIG[ex.category] || { label: ex.category, color: 'text-gray-400', bg: 'bg-gray-500/20' };
                    const percentage = Math.round((ex.count / maxCount) * 100);

                    return (
                        <div key={ex.name} className="flex items-center gap-3">
                            <span className="text-xs text-text-secondary w-4 text-right">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-sm text-text-primary truncate">{ex.name}</span>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-xs text-text-secondary">{ex.count}次</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent/60 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
