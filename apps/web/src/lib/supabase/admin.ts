import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secretKey) {
        throw new Error('Life OPS CLI API is not configured. Missing SUPABASE_SECRET_KEY.');
    }

    return createClient(url, secretKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
