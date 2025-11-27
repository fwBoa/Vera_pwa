import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface TokenPayload {
    username: string;
    role: string;
    exp?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'token';

    constructor(private router: Router) { }

    /**
     * Store JWT token in localStorage
     */
    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Retrieve JWT token from localStorage
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Decode JWT token to extract payload
     */
    private decodeToken(token: string): TokenPayload | null {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Get username from stored token
     */
    getUsername(): string | null {
        const token = this.getToken();
        if (!token) return null;

        const payload = this.decodeToken(token);
        return payload?.username || null;
    }

    /**
     * Get userId for API calls (using username)
     */
    getUserId(): string | null {
        return this.getUsername();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        const payload = this.decodeToken(token);
        if (!payload) return false;

        // Check if token is expired
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (now >= payload.exp) {
                this.logout();
                return false;
            }
        }

        return true;
    }

    /**
     * Logout user and redirect to login page
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this.router.navigate(['/admin/login']);
    }
}
