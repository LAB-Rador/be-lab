import { prismaClient } from '../../lib/prisma.js';
import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { Request, Response } from 'express';

function laboratorySlugFromQuery(req: Request): string | null {
    const raw = req.query.labId;
    if (raw === undefined || raw === null) return null;
    const s = String(raw).trim();
    return s.length > 0 ? s : null;
}

export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '40'), 10)));
        const labSlug = laboratorySlugFromQuery(req);
        if (!labSlug) {
            return res.status(400).json({
                success: false,
                message: 'Missing labId query parameter (current laboratory slug)',
            });
        }

        const lab = await loadLaboratoryIdForActiveUser(id, labSlug);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const rawOnlyUnread = req.query.onlyUnread ?? req.query.unreadOnly;
        const onlyUnread =
            rawOnlyUnread !== undefined &&
            rawOnlyUnread !== null &&
            String(rawOnlyUnread).toLowerCase() !== 'false' &&
            String(rawOnlyUnread) !== '0';

        const items = await prismaClient.notification.findMany({
            where: {
                userId: id,
                laboratoryId: lab.laboratoryId,
                ...(onlyUnread ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        res.status(200).json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const patchNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id, notificationId } = req.params;
        const labSlug = laboratorySlugFromQuery(req);
        if (!labSlug) {
            return res.status(400).json({
                success: false,
                message: 'Missing labId query parameter (current laboratory slug)',
            });
        }

        const lab = await loadLaboratoryIdForActiveUser(id, labSlug);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.notification.findFirst({
            where: { id: notificationId, userId: id, laboratoryId: lab.laboratoryId },
            select: { id: true },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        const updated = await prismaClient.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
