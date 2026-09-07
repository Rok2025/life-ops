'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseSessionId, parseWorkoutInput } from './lib/workoutInput';

async function authorizedClient() {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error('请先登录再保存训练');
    // This is the user's SSR client, never the service-role client.
    return client;
}

async function saveWorkout(sessionId: string | null, value: unknown): Promise<string> {
    const client = await authorizedClient();
    const input = parseWorkoutInput(value, sessionId !== null);
    const { data, error } = await client.rpc('fitness_save_workout', {
        p_session_id: sessionId,
        p_workout_date: input.date,
        p_notes: input.notes,
        p_exercises: input.exercises,
    });
    if (error) throw new Error(error.message);
    if (typeof data !== 'string') throw new Error('保存训练未返回有效记录');
    revalidatePath('/fitness', 'layout');
    return data;
}

export async function createWorkoutAction(input: unknown): Promise<string> {
    return saveWorkout(null, input);
}

export async function updateWorkoutAction(sessionId: string, input: unknown): Promise<void> {
    await saveWorkout(parseSessionId(sessionId), input);
}

export async function deleteWorkoutAction(sessionId: string): Promise<void> {
    const client = await authorizedClient();
    const { error } = await client.rpc('fitness_delete_workout', { p_session_id: parseSessionId(sessionId) });
    if (error) throw new Error(error.message);
    revalidatePath('/fitness', 'layout');
}
