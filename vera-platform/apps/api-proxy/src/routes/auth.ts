import { Request, Response, Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password }); // DEBUG LOG

    if (!username || !password) {
        console.log('Login failed: Missing credentials');
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = AuthService.login(username, password);

    if (result) {
        console.log('Login successful');
        return res.json(result);
    } else {
        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

export default router;
