import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const payload = verifyToken(token);

    if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token.' });
        return;
    }

    req.user = payload;
    next();
}
