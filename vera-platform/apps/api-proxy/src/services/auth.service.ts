import * as jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export class AuthService {
    static login(username: string, password: string): { token: string } | null {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, {
                expiresIn: '1h',
            });
            return { token };
        }
        return null;
    }

    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, SECRET_KEY);
        } catch (error) {
            return null;
        }
    }
}
