import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mock.getUser }, rpc: mock.rpc }) }));
vi.mock('next/cache', () => ({ revalidatePath: mock.revalidate }));
import { createWorkoutAction, updateWorkoutAction, deleteWorkoutAction } from './actions';

const id = '10000000-0000-0000-0000-000000000001';
const input = {
    date: '2026-09-07', notes: ' notes ',
    exercises: [{ exerciseTypeId: id, sets: 3, reps: 12, weight: 20.5 }],
};

beforeEach(() => {
    vi.clearAllMocks();
    mock.getUser.mockResolvedValue({ data: { user: { id } }, error: null });
    mock.rpc.mockResolvedValue({ data: id, error: null });
});

describe('authorized atomic workout actions', () => {
    it('rejects unauthenticated requests before any write', async () => {
        mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
        await expect(createWorkoutAction(input)).rejects.toThrow('登录');
        expect(mock.rpc).not.toHaveBeenCalled();
    });
    it('ignores forged ownership and submits exactly one transactional RPC', async () => {
        await expect(createWorkoutAction({ ...input, user_id: 'forged' })).resolves.toBe(id);
        expect(mock.rpc).toHaveBeenCalledTimes(1);
        expect(mock.rpc).toHaveBeenCalledWith('fitness_save_workout', {
            p_session_id: null, p_workout_date: input.date, p_notes: 'notes',
            p_exercises: [{ exercise_type_id: id, sets: 3, reps: 12, weight: 20.5 }],
        });
        expect(mock.revalidate).toHaveBeenCalledWith('/fitness', 'layout');
    });
    it.each([
        { ...input, date: '2026-02-30' },
        { ...input, exercises: [] },
        { ...input, exercises: [{ ...input.exercises[0], sets: 1.5 }] },
        { ...input, exercises: [{ ...input.exercises[0], weight: Infinity }] },
        { ...input, exercises: [{ ...input.exercises[0], exerciseTypeId: 'invalid' }] },
    ])('rejects invalid input before the RPC', async (invalid) => {
        await expect(createWorkoutAction(invalid)).rejects.toThrow();
        expect(mock.rpc).not.toHaveBeenCalled();
    });
    it('allows clearing sets during editing and preserves the session ID', async () => {
        await updateWorkoutAction(id, { ...input, exercises: [] });
        expect(mock.rpc).toHaveBeenCalledWith('fitness_save_workout', expect.objectContaining({ p_session_id: id, p_exercises: [] }));
    });
    it('propagates database failures without marking the UI as refreshed', async () => {
        mock.rpc.mockResolvedValue({ data: null, error: { message: 'Workout unavailable' } });
        await expect(updateWorkoutAction(id, input)).rejects.toThrow('Workout unavailable');
        expect(mock.revalidate).not.toHaveBeenCalled();
    });
    it('deletes a session with one atomic RPC', async () => {
        await deleteWorkoutAction(id);
        expect(mock.rpc).toHaveBeenCalledTimes(1);
        expect(mock.rpc).toHaveBeenCalledWith('fitness_delete_workout', { p_session_id: id });
    });
});
