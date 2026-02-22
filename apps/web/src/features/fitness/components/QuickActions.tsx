import { Plus, Copy, Target } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyStats } from '../types';

interface QuickActionsProps {
    stats: WeeklyStats;
}

export function QuickActions({ stats }: QuickActionsProps) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 今日训练状态 */}
            {!stats.trainedToday ? (
                <Link
                    href="/fitness/workout/new"
                    className="card p-6 border-2 border-dashed border-accent/50 hover:border-accent hover:bg-accent/5 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={28} className="text-accent" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">开始今日训练</h3>
                            <p className="text-sm text-text-secondary">今天还没有训练记录</p>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="card p-6 bg-success/10 border border-success/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                            <Target size={28} className="text-success" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-success">今日已完成 ✓</h3>
                            <p className="text-sm text-text-secondary">继续保持，你很棒！</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 重复上次训练 */}
            {stats.lastWorkoutId && (
                <Link
                    href={`/fitness/workout/new?copy=${stats.lastWorkoutId}`}
                    className="card p-6 hover:bg-bg-secondary transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Copy size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary">重复上次训练</h3>
                            <p className="text-sm text-text-secondary">快速复制最近一次训练内容</p>
                        </div>
                    </div>
                </Link>
            )}
        </section>
    );
}
