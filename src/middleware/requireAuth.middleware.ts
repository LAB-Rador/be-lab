import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthedRequest = Request & { authUserId?: string };

function verifyBearer(req: AuthedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ success: false, error: 'No token is defined' });
        return;
    }

    const secret = process.env.PUBLIC_KEY;
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
        res.status(500).json({
            success: false,
            error: 'Server configuration error: PUBLIC_KEY missing',
        });
        return;
    }

    jwt.verify(token, secret, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            res.status(401).json({ success: false, error: 'Token is invalid' });
            return;
        }
        if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            req.authUserId = String((decoded as { userId: string }).userId);
            next();
            return;
        }
        res.status(401).json({ success: false, error: 'Token is invalid' });
    });
}

/** JWT must be present and valid. Sets `req.authUserId`. */
export const requireAuth = verifyBearer;

/** After `requireAuth`, ensures URL param matches the authenticated user. */
export const requireSelfUserId =
    (paramName: string = 'id') =>
    (req: AuthedRequest, res: Response, next: NextFunction): void => {
        const paramId = req.params[paramName];
        if (!req.authUserId || paramId !== req.authUserId) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }
        next();
    };
