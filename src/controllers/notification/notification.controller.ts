import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '40'), 10)));

        const items = await prismaClient.notification.findMany({
            where: { userId: id },
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

        const existing = await prismaClient.notification.findFirst({
            where: { id: notificationId, userId: id },
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
