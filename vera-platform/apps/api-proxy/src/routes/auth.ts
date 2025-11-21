import { Request, Response, Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = AuthService.login(username, password);
    if (result) {
        return res.json(result);
    } else {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

export default router;
