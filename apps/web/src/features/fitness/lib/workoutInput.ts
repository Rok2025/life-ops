export type WorkoutWriteInput = {
    date: string;
    notes: string | null;
    exercises: { exercise_type_id: string; sets: number; weight: number; reps: number }[];
};

function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('训练数据格式不正确');
    return value as Record<string, unknown>;
}

export function parseSessionId(value: unknown): string {
    if (typeof value !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
        throw new Error('训练或动作 ID 不正确');
    }
    return value;
}

function number(value: unknown, label: string, max: number, integer = false, min = 0): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max
        || (integer && !Number.isInteger(value))) throw new Error(`${label}不正确`);
    return value;
}

export function parseWorkoutInput(value: unknown, allowEmpty: boolean): WorkoutWriteInput {
    const input = object(value);
    if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('训练日期不正确');
    const date = new Date(`${input.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.date) throw new Error('训练日期不正确');
    if (input.notes !== null && typeof input.notes !== 'string') throw new Error('训练备注不正确');
    const notes = typeof input.notes === 'string' ? input.notes.trim() || null : null;
    if (notes && notes.length > 10000) throw new Error('训练备注过长');
    if (!Array.isArray(input.exercises) || input.exercises.length > 100
        || (!allowEmpty && input.exercises.length === 0)) throw new Error('请填写有效的训练动作');
    const exercises = input.exercises.map((value: unknown) => {
        const exercise = object(value);
        return {
            exercise_type_id: parseSessionId(exercise.exerciseTypeId),
            sets: number(exercise.sets, '组数', 100, true, 1),
            weight: number(exercise.weight, '重量', 9999.99),
            reps: number(exercise.reps, '次数', 1000000, true),
        };
    });
    if (exercises.reduce((sum, exercise) => sum + exercise.sets, 0) > 1000) throw new Error('单次保存的训练组数过多');
    // Pick only writable business fields. Ignore client-supplied identity and metadata.
    return { date: input.date, notes, exercises };
}
