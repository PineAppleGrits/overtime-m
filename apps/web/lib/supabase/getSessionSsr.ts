import { createClient } from '@/lib/supabase/server';

/**
 * Get the current session server-side
 * This should be called from Server Components
 */
export async function getSession() {
    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
}

/**
 * Get the current user server-side
 * This should be called from Server Components
 */
export async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}