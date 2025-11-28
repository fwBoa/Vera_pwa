import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
        console.log('[SupabaseService] Initialized successfully');
    }

    /**
     * Authenticate user with email and password
     */
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('[SupabaseService] Sign in error:', error.message);
            throw new Error(error.message);
        }

        return data;
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('[SupabaseService] Get user error:', error.message);
            throw new Error(error.message);
        }

        return data;
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username: string) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[SupabaseService] Get user error:', error.message);
            throw new Error(error.message);
        }

        return data;
    }

    /**
     * Save fact-check to database
     */
    async saveFactCheck(userId: string | null, question: string, response: string) {
        // Handle guest user or null
        const dbUserId = (userId === 'guest' || !userId) ? null : userId;

        const { data, error } = await this.supabase
            .from('fact_checks')
            .insert({
                user_id: dbUserId,
                question,
                response
            })
            .select()
            .single();

        if (error) {
            console.error('[SupabaseService] Save fact-check error:', error.message);
            throw new Error(error.message);
        }

        return data;
    }

    /**
     * Get user's fact-check history
     */
    async getFactCheckHistory(userId: string, limit: number = 50) {
        const { data, error } = await this.supabase
            .from('fact_checks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[SupabaseService] Get history error:', error.message);
            throw new Error(error.message);
        }

        return data || [];
    }

    /**
     * Verify JWT token from Supabase
     */
    async verifyToken(token: string) {
        const { data, error } = await this.supabase.auth.getUser(token);

        if (error) {
            console.error('[SupabaseService] Verify token error:', error.message);
            return null;
        }

        return data.user;
    }

    /**
     * Sign out user
     */
    async signOut() {
        const { error } = await this.supabase.auth.signOut();

        if (error) {
            console.error('[SupabaseService] Sign out error:', error.message);
            throw new Error(error.message);
        }
    }
}
