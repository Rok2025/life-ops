import { supabase } from '@/lib/supabase';
import { getLocalDateStr } from '@/lib/utils/date';
import type {
    WorkoutSession,
    WorkoutsByDate,
    WeeklyStats,
    WorkoutsByMonth,
    HistoryStats,
    ExerciseType,
    AggregatedExercise,
} from '../types';

type SessionSetRow = {
    id: string;
    set_order: number;
    weight: number | null;
    reps: number | null;
    exercise_types: {
        id: string;
        name: string;
        category: string;
    } | null;
};

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

    /** 获取所有训练记录并按月份分组 */
    getAllWorkoutsByMonth: async (): Promise<WorkoutsByMonth[]> => {
        const { data: sessions, error: sessionError } = await supabase
            .from('workout_sessions')
            .select('id, workout_date, notes')
            .order('workout_date', { ascending: false });

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

                const safeSets = (sets ?? []) as unknown as Array<{
                    weight: number | null;
                    reps: number | null;
                    exercise_types:
                    | { id: string; name: string; category: string }
                    | Array<{ id: string; name: string; category: string }>
                    | null;
                }>;

                safeSets.forEach((set) => {
                    const exerciseType = Array.isArray(set.exercise_types)
                        ? set.exercise_types[0]
                        : set.exercise_types;
                    if (!exerciseType) return;
                    const key = exerciseType.id;

                    if (!exerciseMap.has(key)) {
                        exerciseMap.set(key, {
                            name: exerciseType.name,
                            category: exerciseType.category,
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
            }),
        );

        const groupedByMonth = new Map<string, WorkoutSession[]>();
        workouts.forEach((workout) => {
            const monthKey = workout.date.substring(0, 7);
            if (!groupedByMonth.has(monthKey)) {
                groupedByMonth.set(monthKey, []);
            }
            groupedByMonth.get(monthKey)!.push(workout);
        });

        return Array.from(groupedByMonth.entries()).map(([month, monthSessions]) => {
            const [year, m] = month.split('-');
            const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            return {
                month,
                label: `${year}年${monthNames[parseInt(m)]}`,
                sessions: monthSessions,
            };
        });
    },

    /** 获取历史页统计数据 */
    getHistoryStats: async (): Promise<HistoryStats> => {
        const { count: totalCount } = await supabase
            .from('workout_sessions')
            .select('*', { count: 'exact', head: true });

        const { data: allSets } = await supabase
            .from('workout_sets')
            .select('weight, reps');

        let totalVolume = 0;
        let totalSets = 0;
        allSets?.forEach((set) => {
            totalSets += 1;
            totalVolume += (set.weight || 0) * (set.reps || 0);
        });

        return {
            totalWorkouts: totalCount || 0,
            totalSets,
            totalVolume,
        };
    },

    /** 获取训练动作类型 */
    getExerciseTypes: async (): Promise<ExerciseType[]> => {
        const { data, error } = await supabase
            .from('exercise_types')
            .select('id, name, category')
            .order('category')
            .order('name');
        if (error) throw error;
        return data ?? [];
    },

    /** 获取训练会话详情 */
    getWorkoutSession: async (sessionId: string): Promise<{ id: string; workout_date: string; notes: string | null } | null> => {
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        if (error) return null;
        return data;
    },

    /** 获取训练会话对应的训练组 */
    getWorkoutSets: async (sessionId: string): Promise<SessionSetRow[]> => {
        const { data, error } = await supabase
            .from('workout_sets')
            .select('id, set_order, weight, reps, exercise_types(id, name, category)')
            .eq('session_id', sessionId)
            .order('set_order');
        if (error) throw error;
        return (data ?? []) as unknown as SessionSetRow[];
    },

    /** 获取用于复制训练的模板数据 */
    getWorkoutCopyTemplate: async (sessionId: string): Promise<{ notes: string | null; exercises: AggregatedExercise[] }> => {
        const session = await fitnessApi.getWorkoutSession(sessionId);
        const sets = await fitnessApi.getWorkoutSets(sessionId);

        const exerciseMap = new Map<string, AggregatedExercise>();
        sets.forEach((set) => {
            if (!set.exercise_types) return;
            const key = set.exercise_types.id;

            if (!exerciseMap.has(key)) {
                exerciseMap.set(key, {
                    exerciseTypeId: set.exercise_types.id,
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
            notes: session?.notes ?? null,
            exercises: Array.from(exerciseMap.values()),
        };
    },

    /** 聚合训练组为动作 */
    aggregateExercises: (setsData: SessionSetRow[]): AggregatedExercise[] => {
        const exerciseMap = new Map<string, AggregatedExercise>();

        setsData.forEach((set) => {
            if (!set.exercise_types) return;
            const key = set.exercise_types.id;

            if (!exerciseMap.has(key)) {
                exerciseMap.set(key, {
                    exerciseTypeId: set.exercise_types.id,
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

        return Array.from(exerciseMap.values());
    },

    /** 创建训练记录 */
    createWorkoutSessionWithSets: async (input: {
        date: string;
        notes: string | null;
        exercises: AggregatedExercise[];
    }): Promise<string> => {
        const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
                workout_date: input.date,
                notes: input.notes,
            })
            .select('id')
            .single();

        if (sessionError) throw sessionError;

        const workoutSetsData = input.exercises.flatMap((exercise, exerciseIndex) => {
            return Array.from({ length: exercise.sets }, (_, setIndex) => ({
                session_id: session.id,
                exercise_type_id: exercise.exerciseTypeId,
                set_order: exerciseIndex * 100 + setIndex + 1,
                weight: exercise.weight,
                reps: exercise.reps,
            }));
        });

        if (workoutSetsData.length > 0) {
            const { error: setsError } = await supabase
                .from('workout_sets')
                .insert(workoutSetsData);
            if (setsError) throw setsError;
        }

        return session.id;
    },

    /** 更新训练记录 */
    updateWorkoutSessionWithSets: async (sessionId: string, input: {
        date: string;
        notes: string | null;
        exercises: AggregatedExercise[];
    }): Promise<void> => {
        const { error: sessionError } = await supabase
            .from('workout_sessions')
            .update({
                workout_date: input.date,
                notes: input.notes,
            })
            .eq('id', sessionId);
        if (sessionError) throw sessionError;

        const { error: deleteSetsError } = await supabase
            .from('workout_sets')
            .delete()
            .eq('session_id', sessionId);
        if (deleteSetsError) throw deleteSetsError;

        const newSetsData = input.exercises.flatMap((exercise, exerciseIndex) => {
            return Array.from({ length: exercise.sets }, (_, setIndex) => ({
                session_id: sessionId,
                exercise_type_id: exercise.exerciseTypeId,
                set_order: exerciseIndex * 100 + setIndex + 1,
                weight: exercise.weight,
                reps: exercise.reps,
            }));
        });

        if (newSetsData.length > 0) {
            const { error: setsError } = await supabase
                .from('workout_sets')
                .insert(newSetsData);
            if (setsError) throw setsError;
        }
    },

    /** 删除训练记录 */
    deleteWorkoutSession: async (sessionId: string): Promise<void> => {
        const { error: setsError } = await supabase
            .from('workout_sets')
            .delete()
            .eq('session_id', sessionId);
        if (setsError) throw setsError;

        const { error: sessionError } = await supabase
            .from('workout_sessions')
            .delete()
            .eq('id', sessionId);
        if (sessionError) throw sessionError;
    },

    /** 获取指定日期的训练记录 */
    getWorkoutsByDate: async (date: string): Promise<WorkoutSession[]> => {
        const { data: sessions, error } = await supabase
            .from('workout_sessions')
            .select('id, workout_date, notes')
            .eq('workout_date', date)
            .order('created_at', { ascending: false });

        if (error || !sessions) return [];

        return Promise.all(
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
                    exerciseMap.get(key)!.sets += 1;
                });

                return {
                    id: session.id,
                    date: session.workout_date,
                    notes: session.notes,
                    exercises: Array.from(exerciseMap.values()),
                };
            }),
        );
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
