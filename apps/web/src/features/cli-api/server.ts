import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { CLI_SCOPES } from './types';
import type { CliScope, CliTokenRecord, CliToolDescriptor, CliToolResult, FinanceTransactionInput, FitnessWorkoutInput } from './types';

const DEVICE_CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function getLocalDateString(timezone = 'Asia/Shanghai'): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

export const CLI_TOOLS: CliToolDescriptor[] = [
    {
        name: 'log_finance_transaction',
        description: 'Record one finance transaction for the authenticated Life OPS account.',
        scope: 'finance:write',
    },
    {
        name: 'log_fitness_workout',
        description: 'Record one workout and its exercise sets for the authenticated Life OPS account.',
        scope: 'fitness:write',
    },
];

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

function createUserCode(): string {
    return randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

function getValidScopes(input: unknown): CliScope[] {
    if (!Array.isArray(input) || input.length === 0) return ['tools:read', 'finance:write', 'fitness:write'];
    const scopes = input.filter((scope): scope is CliScope =>
        typeof scope === 'string' && (CLI_SCOPES as readonly string[]).includes(scope),
    );
    if (scopes.length !== input.length) throw new Error('Requested scope is not supported.');
    return [...new Set(scopes)];
}

function assertString(value: unknown, field: string, maxLength: number, required = false): string | null {
    if (value == null || value === '') {
        if (required) throw new Error(`${field} is required.`);
        return null;
    }
    if (typeof value !== 'string') throw new Error(`${field} must be a string.`);
    const normalized = value.trim();
    if (!normalized && required) throw new Error(`${field} is required.`);
    if (normalized.length > maxLength) throw new Error(`${field} is too long.`);
    return normalized || null;
}

function getFinanceInput(input: unknown): Required<Omit<FinanceTransactionInput, 'account_name' | 'merchant' | 'note'>> & Pick<FinanceTransactionInput, 'account_name' | 'merchant' | 'note'> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('input must be an object.');
    const raw = input as Record<string, unknown>;
    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99_999_999) throw new Error('amount must be a positive number.');

    const transactionType = raw.transaction_type ?? 'expense';
    if (!['expense', 'income', 'repayment', 'transfer'].includes(String(transactionType))) {
        throw new Error('transaction_type is invalid.');
    }

    const occurredDate = raw.occurred_date ?? getLocalDateString('Asia/Shanghai');
    if (typeof occurredDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(occurredDate)) {
        throw new Error('occurred_date must be YYYY-MM-DD.');
    }

    return {
        occurred_date: occurredDate,
        amount: Math.round(amount * 100) / 100,
        transaction_type: transactionType as Required<FinanceTransactionInput>['transaction_type'],
        category: assertString(raw.category ?? 'other', 'category', 80, true)!,
        merchant: assertString(raw.merchant, 'merchant', 160) ?? undefined,
        note: assertString(raw.note, 'note', 1000) ?? undefined,
        account_name: assertString(raw.account_name, 'account_name', 100) ?? undefined,
    };
}

function getFitnessWorkoutInput(input: unknown): Required<FitnessWorkoutInput> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('input must be an object.');
    const raw = input as Record<string, unknown>;
    const workoutDate = raw.workout_date ?? getLocalDateString('Asia/Shanghai');
    if (typeof workoutDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(workoutDate)) throw new Error('workout_date must be YYYY-MM-DD.');
    if (!Array.isArray(raw.exercises) || raw.exercises.length === 0 || raw.exercises.length > 30) throw new Error('exercises must contain 1 to 30 items.');
    return {
        workout_date: workoutDate,
        notes: assertString(raw.notes, 'notes', 1000) ?? '',
        exercises: raw.exercises.map((item, index) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`exercises[${index}] must be an object.`);
            const exercise = item as Record<string, unknown>;
            const weight = Number(exercise.weight);
            const sets = Number(exercise.sets);
            const reps = Number(exercise.reps);
            if (!Number.isFinite(weight) || weight < 0 || weight > 9_999) throw new Error(`exercises[${index}].weight is invalid.`);
            if (!Number.isInteger(sets) || sets < 1 || sets > 100) throw new Error(`exercises[${index}].sets must be an integer between 1 and 100.`);
            if (!Number.isInteger(reps) || reps < 0 || reps > 10_000) throw new Error(`exercises[${index}].reps is invalid.`);
            return { exercise_name: assertString(exercise.exercise_name, `exercises[${index}].exercise_name`, 120, true)!, weight, sets, reps };
        }),
    };
}

export async function startCliDeviceAuthorization(input: unknown): Promise<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
}> {
    const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
    const deviceName = assertString(raw.device_name, 'device_name', 120, true)!;
    const deviceCode = randomBytes(32).toString('base64url');
    const userCode = createUserCode();
    const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_MS).toISOString();
    const admin = createAdminClient();
    const { error } = await admin.from('cli_device_authorizations').insert({
        device_code_hash: sha256(deviceCode),
        user_code: userCode,
        device_name: deviceName,
        requested_scopes: getValidScopes(raw.scopes),
        expires_at: expiresAt,
    });
    if (error) throw new Error(`Could not start device authorization: ${error.message}`);

    const baseUrl = process.env.LIFE_OPS_PUBLIC_URL ?? 'https://life-ops-web.vercel.app';
    const verificationUri = `${baseUrl}/cli/authorize`;
    return {
        device_code: deviceCode,
        user_code: userCode,
        verification_uri: verificationUri,
        verification_uri_complete: `${verificationUri}?code=${encodeURIComponent(userCode)}`,
        expires_in: DEVICE_CODE_TTL_MS / 1000,
        interval: 3,
    };
}

export async function approveCliDeviceAuthorization(userId: string, userCode: string): Promise<{ deviceName: string; scopes: CliScope[] }> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('cli_device_authorizations')
        .update({ status: 'approved', user_id: userId, approved_at: new Date().toISOString() })
        .eq('user_code', userCode.trim().toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .select('device_name,requested_scopes')
        .maybeSingle();
    if (error) throw new Error(`Could not approve device: ${error.message}`);
    if (!data) throw new Error('Authorization code is invalid, expired, or already used.');
    return { deviceName: data.device_name as string, scopes: data.requested_scopes as CliScope[] };
}

export async function exchangeCliDeviceCode(deviceCode: string): Promise<{ access_token: string; expires_in: number }> {
    const admin = createAdminClient();
    const codeHash = sha256(deviceCode);
    const { data: authorization, error: authorizationError } = await admin
        .from('cli_device_authorizations')
        .select('id,user_id,device_name,requested_scopes,status,expires_at')
        .eq('device_code_hash', codeHash)
        .maybeSingle();
    if (authorizationError) throw new Error(`Could not read device authorization: ${authorizationError.message}`);
    if (!authorization || new Date(authorization.expires_at as string).getTime() <= Date.now()) {
        throw new Error('expired_token');
    }
    if (authorization.status === 'pending') throw new Error('authorization_pending');
    if (authorization.status !== 'approved' || !authorization.user_id) throw new Error('access_denied');

    const { data: consumed, error: consumeError } = await admin
        .from('cli_device_authorizations')
        .update({ status: 'consumed' })
        .eq('id', authorization.id as string)
        .eq('status', 'approved')
        .select('id')
        .maybeSingle();
    if (consumeError) throw new Error(`Could not finish device authorization: ${consumeError.message}`);
    if (!consumed) throw new Error('access_denied');

    const token = `lop_${randomBytes(32).toString('base64url')}`;
    const { error: tokenError } = await admin.from('cli_access_tokens').insert({
        user_id: authorization.user_id as string,
        device_authorization_id: authorization.id as string,
        token_prefix: token.slice(0, 12),
        token_hash: sha256(token),
        device_name: authorization.device_name as string,
        scopes: authorization.requested_scopes as CliScope[],
        expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    });
    if (tokenError) throw new Error(`Could not create access token: ${tokenError.message}`);
    return { access_token: token, expires_in: TOKEN_TTL_MS / 1000 };
}

export async function authenticateCliRequest(request: Request, requiredScope?: CliScope): Promise<CliTokenRecord> {
    const rawAuthorization = request.headers.get('authorization');
    const token = rawAuthorization?.startsWith('Bearer ') ? rawAuthorization.slice(7).trim() : '';
    if (!token.startsWith('lop_')) throw new Error('unauthorized');

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('cli_access_tokens')
        .select('id,user_id,device_name,scopes,expires_at,revoked_at')
        .eq('token_hash', sha256(token))
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
    if (error) throw new Error(`Could not validate access token: ${error.message}`);
    if (!data) throw new Error('unauthorized');
    const record = data as CliTokenRecord;
    if (requiredScope && !record.scopes.includes(requiredScope)) throw new Error('forbidden');
    void admin.from('cli_access_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', record.id);
    return record;
}

export async function revokeCliToken(userId: string, tokenId: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin
        .from('cli_access_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', tokenId)
        .eq('user_id', userId)
        .is('revoked_at', null);
    if (error) throw new Error(`Could not revoke CLI token: ${error.message}`);
}

async function claimIdempotencyKey(userId: string, idempotencyKey: string, requestHash: string): Promise<{ status: string; response_json: CliToolResult | null; error_message: string | null }> {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('cli_claim_idempotency_key', {
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_request_hash: requestHash,
    });
    if (error) throw new Error(error.message);
    const claim = Array.isArray(data) ? data[0] : null;
    if (!claim) throw new Error('Could not claim idempotency key.');
    return claim as { status: string; response_json: CliToolResult | null; error_message: string | null };
}

export async function logFinanceTransaction(token: CliTokenRecord, input: unknown, idempotencyKey: string): Promise<{ result: CliToolResult; replayed: boolean }> {
    if (!/^[A-Za-z0-9._:-]{16,200}$/.test(idempotencyKey)) throw new Error('Idempotency-Key is invalid.');
    const normalized = getFinanceInput(input);
    const requestHash = sha256(JSON.stringify({ tool: 'log_finance_transaction', input: normalized }));
    const claim = await claimIdempotencyKey(token.user_id, idempotencyKey, requestHash);
    if (claim.status === 'completed' && claim.response_json) return { result: claim.response_json, replayed: true };
    if (claim.status === 'processing') throw new Error('Request with this Idempotency-Key is still processing.');
    if (claim.status === 'failed') throw new Error(claim.error_message ?? 'The previous request failed. Use a new Idempotency-Key after correcting it.');
    if (claim.status !== 'claimed') throw new Error('Could not claim idempotency key.');

    const admin = createAdminClient();
    try {
        let accountId: string | null = null;
        let accountResolution: 'matched' | 'not_provided' | 'not_found' = 'not_provided';
        if (normalized.account_name) {
            const { data: accounts, error: accountError } = await admin
                .from('finance_accounts')
                .select('id')
                .eq('user_id', token.user_id)
                .ilike('name', normalized.account_name)
                .limit(2);
            if (accountError) throw new Error(accountError.message);
            if (accounts?.length === 1) {
                accountId = accounts[0].id as string;
                accountResolution = 'matched';
            } else {
                accountResolution = 'not_found';
            }
        }

        const { data: transaction, error: insertError } = await admin
            .from('finance_transactions')
            .insert({
                user_id: token.user_id,
                account_id: accountId,
                occurred_date: normalized.occurred_date,
                amount: normalized.amount,
                transaction_type: normalized.transaction_type,
                category: normalized.category,
                merchant: normalized.merchant ?? null,
                note: normalized.note ?? null,
            })
            .select('id,occurred_date,amount,transaction_type,category,merchant,account_id')
            .single();
        if (insertError || !transaction) throw new Error(insertError?.message ?? 'Could not create transaction.');

        const amountText = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(Number(transaction.amount));
        const merchantText = transaction.merchant ? `（${transaction.merchant}）` : '';
        const accountNote = accountResolution === 'not_found' ? `；未找到账户“${normalized.account_name}”，已按未绑定账户记录` : '';
        const result: CliToolResult = {
            toolName: 'log_finance_transaction',
            confirmation: `已记录：${transaction.occurred_date} ${transaction.category} ${amountText} 元${merchantText}${accountNote}`,
            data: { transaction, accountResolution },
        };
        await admin.from('cli_idempotency_keys').update({ status: 'completed', response_json: result, completed_at: new Date().toISOString() })
            .eq('user_id', token.user_id).eq('idempotency_key', idempotencyKey);
        await admin.from('cli_api_audit_logs').insert({
            user_id: token.user_id,
            token_id: token.id,
            tool_name: 'log_finance_transaction',
            idempotency_key: idempotencyKey,
            status: 'completed',
            request_summary: { occurred_date: normalized.occurred_date, amount: normalized.amount, transaction_type: normalized.transaction_type, category: normalized.category },
            result_summary: { transaction_id: transaction.id, account_resolution: accountResolution },
        });
        return { result, replayed: false };
    } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 240) : 'Unable to create transaction.';
        await admin.from('cli_idempotency_keys').update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
            .eq('user_id', token.user_id).eq('idempotency_key', idempotencyKey);
        await admin.from('cli_api_audit_logs').insert({
            user_id: token.user_id,
            token_id: token.id,
            tool_name: 'log_finance_transaction',
            idempotency_key: idempotencyKey,
            status: 'failed',
            request_summary: { occurred_date: normalized.occurred_date, amount: normalized.amount, transaction_type: normalized.transaction_type, category: normalized.category },
            result_summary: { error: message },
        });
        throw error;
    }
}

export async function logFitnessWorkout(token: CliTokenRecord, input: unknown, idempotencyKey: string): Promise<{ result: CliToolResult; replayed: boolean }> {
    if (!/^[A-Za-z0-9._:-]{16,200}$/.test(idempotencyKey)) throw new Error('Idempotency-Key is invalid.');
    const normalized = getFitnessWorkoutInput(input);
    const requestHash = sha256(JSON.stringify({ tool: 'log_fitness_workout', input: normalized }));
    const claim = await claimIdempotencyKey(token.user_id, idempotencyKey, requestHash);
    if (claim.status === 'completed' && claim.response_json) return { result: claim.response_json, replayed: true };
    if (claim.status !== 'claimed') throw new Error(claim.status === 'processing' ? 'Request with this Idempotency-Key is still processing.' : claim.error_message ?? 'Could not claim idempotency key.');
    const admin = createAdminClient();
    try {
        const names = normalized.exercises.map((exercise) => exercise.exercise_name);
        const { data: types, error: typeError } = await admin.from('exercise_types').select('id,name').in('name', names);
        if (typeError) throw new Error(typeError.message);
        const ids = new Map((types ?? []).map((type) => [type.name as string, type.id as string]));
        const missing = names.filter((name) => !ids.has(name));
        if (missing.length) throw new Error(`Unknown exercise_name: ${[...new Set(missing)].join(', ')}`);
        const { data, error } = await admin.rpc('cli_log_fitness_workout', {
            p_user_id: token.user_id,
            p_workout_date: normalized.workout_date,
            p_notes: normalized.notes || null,
            p_exercises: normalized.exercises.map((exercise) => ({ exercise_type_id: ids.get(exercise.exercise_name), weight: exercise.weight, sets: exercise.sets, reps: exercise.reps })),
        });
        if (error || !data) throw new Error(error?.message ?? 'Could not create workout.');
        const workout = Array.isArray(data) ? data[0] : data;
        const result: CliToolResult = { toolName: 'log_fitness_workout', confirmation: `已记录：${normalized.workout_date} 训练 ${normalized.exercises.length} 个动作，共 ${workout.created_sets} 组`, data: { workout } };
        await admin.from('cli_idempotency_keys').update({ status: 'completed', response_json: result, completed_at: new Date().toISOString() }).eq('user_id', token.user_id).eq('idempotency_key', idempotencyKey);
        await admin.from('cli_api_audit_logs').insert({ user_id: token.user_id, token_id: token.id, tool_name: 'log_fitness_workout', idempotency_key: idempotencyKey, status: 'completed', request_summary: { workout_date: normalized.workout_date, exercise_count: normalized.exercises.length }, result_summary: { session_id: workout.session_id, created_sets: workout.created_sets } });
        return { result, replayed: false };
    } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 240) : 'Unable to create workout.';
        await admin.from('cli_idempotency_keys').update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() }).eq('user_id', token.user_id).eq('idempotency_key', idempotencyKey);
        await admin.from('cli_api_audit_logs').insert({ user_id: token.user_id, token_id: token.id, tool_name: 'log_fitness_workout', idempotency_key: idempotencyKey, status: 'failed', request_summary: { workout_date: normalized.workout_date, exercise_count: normalized.exercises.length }, result_summary: { error: message } });
        throw error;
    }
}

export async function listUserCliTokens(userId: string): Promise<Array<Pick<CliTokenRecord, 'id' | 'device_name' | 'scopes' | 'expires_at' | 'revoked_at'> & { last_used_at: string | null; created_at: string }>> {
    const admin = createAdminClient();
    const { data, error } = await admin.from('cli_access_tokens')
        .select('id,device_name,scopes,expires_at,revoked_at,last_used_at,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(`Could not list CLI devices: ${error.message}`);
    return (data ?? []) as Array<Pick<CliTokenRecord, 'id' | 'device_name' | 'scopes' | 'expires_at' | 'revoked_at'> & { last_used_at: string | null; created_at: string }>;
}
