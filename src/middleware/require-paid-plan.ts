import type { NextFunction, Request, Response } from 'express';
import { laboratoryAllowsPaidFeatures, PAID_FEATURE_MESSAGE } from '../lib/paid-access.js';
import { loadLaboratoryIdForActiveUser } from '../lib/load-laboratory-for-active-user.js';

type SessionRequest = Request & { userId?: string };

function text(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function laboratorySlug(req: Request) {
    const body = req.body as { laboratoryId?: unknown } | undefined;
    return text(req.params.labId) ?? text(req.query.labId) ?? text(body?.laboratoryId);
}

export function requirePaidPlan(req: Request, res: Response, next: NextFunction) {
    const userId = (req as SessionRequest).userId;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }

    const labSlug = laboratorySlug(req);
    if (!labSlug) {
        res.status(400).json({ success: false, message: 'Missing laboratory' });
        return;
    }

    loadLaboratoryIdForActiveUser(userId, labSlug)
        .then(async (lab) => {
            if (!lab) {
                res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
                return;
            }
            const allowed = await laboratoryAllowsPaidFeatures(lab.laboratoryId);
            if (!allowed) {
                res.status(403).json({ success: false, message: PAID_FEATURE_MESSAGE });
                return;
            }
            next();
        })
        .catch((error) => {
            console.error('Error checking plan:', error);
            res.status(500).json({ success: false, message: 'Failed to check the plan' });
        });
}
