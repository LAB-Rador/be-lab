import type { NextFunction, Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';

type SessionRequest = Request & { userId?: string };

function sessionUserId(req: Request): string | null {
    const value = (req as SessionRequest).userId;
    return typeof value === 'string' && value.length > 0 ? value : null;
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const secret = process.env.PUBLIC_KEY;
    if (!secret || secret.trim() === '') {
        return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    jwt.verify(token, secret, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err || typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const userId = decoded.userId;
        if (typeof userId !== 'string' || userId.length === 0) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        (req as SessionRequest).userId = userId;
        next();
    });
}

export function rejectForeignUserParam(router: Router, paramName: string) {
    router.param(paramName, (req, res, next, value) => {
        if (value !== sessionUserId(req)) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        next();
    });
}

export function useCaller(req: Request, res: Response, claimed?: unknown): string | null {
    const userId = sessionUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return null;
    }
    if (claimed !== undefined && claimed !== null && claimed !== '') {
        if (typeof claimed !== 'string' || claimed !== userId) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return null;
        }
    }
    return userId;
}
