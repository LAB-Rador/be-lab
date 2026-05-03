import { NotificationType } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';

/**
 * In-app notification for the assignee when someone else assigns (or reassigns) a task.
 */
export async function createTaskAssignedInAppNotification(params: {
    actorUserId: string;
    assigneeUserId: string;
    taskTitle: string;
    contextLabel: string;
}): Promise<void> {
    const { actorUserId, assigneeUserId, taskTitle, contextLabel } = params;
    if (assigneeUserId === actorUserId) {
        return;
    }
    const safeTitle = taskTitle.trim().slice(0, 200);
    await prismaClient.notification.create({
        data: {
            userId: assigneeUserId,
            title: 'New task assigned',
            message: `${contextLabel}: ${safeTitle}`,
            type: NotificationType.TASK,
        },
    });
}
