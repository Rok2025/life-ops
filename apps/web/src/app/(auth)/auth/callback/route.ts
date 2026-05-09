import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const redirectTo = new URL('/', requestUrl.origin);

    if (!code) {
        redirectTo.pathname = '/login';
        redirectTo.searchParams.set('error', 'missing_code');
        return NextResponse.redirect(redirectTo);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        redirectTo.pathname = '/login';
        redirectTo.searchParams.set('error', 'auth_callback_failed');
        return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(redirectTo);
}
