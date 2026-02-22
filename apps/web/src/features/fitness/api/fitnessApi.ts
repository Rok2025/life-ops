import { supabase } from '@/lib/supabase';
import { getLocalDateStr } from '@/lib/utils/date';
import type { WorkoutSession, WorkoutsByDate, WeeklyStats } from '../types';

export const fitnessApi = {
    /** 获取最近训练记录（按日期分组） */
    getWorkouts: async (limit = 10): Promise<WorkoutsByDate[]> => {
        const { data: sessions, error: sessionError } = await supabase
            .from('workout_sessions')
            .select('id, workout_date, notes')
            .order('workout_date', { ascending: false })
            .limit(limit);

        if (sessionError || !sessions) {
            console.error('获取训练记录失败:', sessionError);
            return [];
        }

        const workouts: WorkoutSession[] = await Promise.all(
            sessions.map(async (session) => {
                const { data: sets } = await supabase
                    .from('workout_sets')
                    .select('weight, reps, exercise_types(id, name, category)')
                    .eq('session_id', session.id)
                    .order('set_order');

                const exerciseMap = new Map<string, {
                    name: string;
                    category: string;
                    weight: number;
                    sets: number;
                    reps: number;
                }>();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sets?.forEach((set: any) => {
                    if (!set.exercise_types) return;
                    const key = set.exercise_types.id;

                    if (!exerciseMap.has(key)) {
                        exerciseMap.set(key, {
                            name: set.exercise_types.name,
                            category: set.exercise_types.category,
                            weight: set.weight || 0,
                            sets: 0,
                            reps: set.reps || 0,
                        });
                    }

                    const exercise = exerciseMap.get(key)!;
                    exercise.sets += 1;
                });

                return {
                    id: session.id,
                    date: session.workout_date,
                    notes: session.notes,
                    exercises: Array.from(exerciseMap.values()),
                };
            })
        );

        const groupedByDate = new Map<string, WorkoutSession[]>();
        workouts.forEach(workout => {
            if (!groupedByDate.has(workout.date)) {
                groupedByDate.set(workout.date, []);
            }
            groupedByDate.get(workout.date)!.push(workout);
        });

        return Array.from(groupedByDate.entries()).map(([date, sessions]) => ({
            date,
            sessions,
        }));
    },

    /** 获取本周详细统计 */
    getWeeklyStats: async (): Promise<WeeklyStats> => {
        const now = new Date();
        const today = getLocalDateStr(now);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data: weekSessions } = await supabase
            .from('workout_sessions')
            .select('id, workout_date')
            .gte('workout_date', getLocalDateStr(startOfWeek))
            .order('workout_date', { ascending: false });

        const uniqueDates = new Set(weekSessions?.map(s => s.workout_date) || []);
        const trainedToday = uniqueDates.has(today);
        const lastWorkoutId = weekSessions?.[0]?.id || null;

        let totalSets = 0;
        let totalVolume = 0;
        const categoryBreakdown: Record<string, number> = {};

        if (weekSessions && weekSessions.length > 0) {
            const sessionIds = weekSessions.map(s => s.id);
            const { data: sets } = await supabase
                .from('workout_sets')
                .select('weight, reps, exercise_types(category)')
                .in('session_id', sessionIds);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sets?.forEach((set: any) => {
                totalSets++;
                totalVolume += (set.weight || 0) * (set.reps || 0);
                const cat = set.exercise_types?.category || 'other';
                categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
            });
        }

        // 计算连续训练天数
        let streak = 0;
        const { data: allSessions } = await supabase
            .from('workout_sessions')
            .select('workout_date')
            .order('workout_date', { ascending: false })
            .limit(30);

        if (allSessions) {
            const dates = [...new Set(allSessions.map(s => s.workout_date))].sort().reverse();
            const checkDate = new Date(today);

            for (const dateStr of dates) {
                const expectedDate = getLocalDateStr(checkDate);
                if (dateStr === expectedDate) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (dateStr === getLocalDateStr(new Date(checkDate.getTime() - 86400000))) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    if (dateStr === getLocalDateStr(checkDate)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    }
                } else {
                    break;
                }
            }
        }

        return {
            count: uniqueDates.size,
            totalSets,
            totalVolume,
            categoryBreakdown,
            streak,
            trainedToday,
            lastWorkoutId,
        };
    },

    /** 获取本周训练天数（供首页使用） */
    getWeeklyWorkoutDays: async (): Promise<number> => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('workout_date')
            .gte('workout_date', getLocalDateStr(startOfWeek));

        if (error) {
            console.error('获取本周训练次数失败:', error);
            return 0;
        }
        const uniqueDates = new Set(data?.map(s => s.workout_date) || []);
        return uniqueDates.size;
    },
};
