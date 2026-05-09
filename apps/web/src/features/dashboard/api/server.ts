import { createClient } from '@/lib/supabase/server';
import { getLocalDateStr, getWeekDateRange } from '@/lib/utils/date';
import type { HomeDashboardSnapshot } from '../types';

export async function getHomeDashboardSnapshot(): Promise<HomeDashboardSnapshot> {
    const supabase = await createClient();
    const today = getLocalDateStr();
    const { start: weekStart } = getWeekDateRange();

    const [frogsResult, tilResult, notesResult, workoutsResult] = await Promise.all([
        supabase
            .from('daily_frogs')
            .select('is_completed')
            .eq('frog_date', today),
        supabase
            .from('daily_til')
            .select('*', { count: 'exact', head: true })
            .eq('til_date', today),
        supabase
            .from('quick_notes')
            .select('*', { count: 'exact', head: true })
            .eq('note_date', today)
            .neq('type', 'todo'),
        supabase
            .from('workout_sessions')
            .select('workout_date')
            .gte('workout_date', weekStart),
    ]);

    if (frogsResult.error) throw frogsResult.error;
    if (tilResult.error) throw tilResult.error;
    if (notesResult.error) throw notesResult.error;
    if (workoutsResult.error) throw workoutsResult.error;

    const frogs = frogsResult.data ?? [];
    const workoutDates = new Set((workoutsResult.data ?? []).map(item => item.workout_date));

    return {
        today,
        frogsStats: {
            completed: frogs.filter(item => item.is_completed).length,
            total: frogs.length,
        },
        tilCount: tilResult.count ?? 0,
        notesCount: notesResult.count ?? 0,
        weeklyWorkoutDays: workoutDates.size,
    };
}
