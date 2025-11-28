import { Request, Response, Router } from 'express';
import { SupabaseService } from '../services/supabase.service';
import * as jwt from 'jsonwebtoken';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    console.log('[Auth Route] Login attempt:', { username });

    if (!username || !password) {
        console.log('[Auth Route] Login failed: Missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Instantiate service here to avoid crash on startup if env vars are missing
        const supabaseService = new SupabaseService();

        // Check if user exists in our database by username
        const user = await supabaseService.getUserByUsername(username);

        if (!user) {
            console.log('[Auth Route] Login failed: User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For now, we'll use a simple password check
        // In production, you should hash passwords!
        // Temporarily using the same check as before until we set up proper auth
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (password !== ADMIN_PASSWORD) {
            console.log('[Auth Route] Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token with user info
        const token = jwt.sign(
            {
                username: user.username,
                email: user.email,
                role: user.role,
                userId: user.id
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        console.log('[Auth Route] Login successful for user:', user.username);
        return res.json({ token });

    } catch (error: any) {
        console.error('[Auth Route] Login error:', error.message);
        return res.status(500).json({ error: 'Authentication failed' });
    }
});

export default router;
