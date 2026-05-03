import { createTaskAssignedInAppNotification } from '../../services/notification/task-assigned-in-app.service.js';
import { sendTaskAssignedEmail } from '../../services/email/task-assigned-notification.service.js';
import { formatUserDisplayName } from '../../lib/format-user-display-name.js';
import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { AccessStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const assignedToSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
};

async function assigneeIsActiveLabMember(laboratoryId: string, assignedToId: string): Promise<boolean> {
    const m = await prismaClient.userLaboratory.findFirst({
        where: {
            userId: assignedToId,
            laboratoryId,
            accessStatus: AccessStatus.ACTIVE,
        },
        select: { id: true },
    });
    return !!m;
}

function parseOptionalEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const s = String(value);
    return allowed.includes(s as T) ? (s as T) : undefined;
}

export const getPaginatedLaboratoryTasks = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '10'), 10)));
        const assigneeScope = String(req.query.assigneeScope ?? '');
        const status = parseOptionalEnum(req.query.status, Object.values(TaskStatus) as TaskStatus[]);
        const priority = parseOptionalEnum(req.query.priority, Object.values(TaskPriority) as TaskPriority[]);
        const dueDateFromRaw = req.query.dueDateFrom;
        const dueDateToRaw = req.query.dueDateTo;

        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const where: {
            laboratoryId: string;
            experimentId: null;
            status?: TaskStatus;
            priority?: TaskPriority;
            assignedToId?: string;
            dueDate?: { gte: Date; lte: Date };
        } = {
            laboratoryId: lab.laboratoryId,
            experimentId: null,
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigneeScope === 'me') where.assignedToId = userId;

        if (dueDateFromRaw && dueDateToRaw && typeof dueDateFromRaw === 'string' && typeof dueDateToRaw === 'string') {
            const from = new Date(dueDateFromRaw);
            const to = new Date(dueDateToRaw);
            if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
                where.dueDate = { gte: from, lte: to };
            }
        }

        const totalCount = await prismaClient.task.count({ where });

        const items = await prismaClient.task.findMany({
            where,
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                assignedTo: { select: assignedToSelect },
                createdBy: { select: assignedToSelect },
            },
        });

        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const hasPreviousPage = page > 1;
        const hasNextPage = page < totalPages;

        res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    currentPage: page,
                    totalPages,
                    pageSize,
                    totalCount,
                    hasPreviousPage,
                    hasNextPage,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching laboratory tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch laboratory tasks',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const createLaboratoryTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const { title, description, assignedToId, dueDate, priority, status } = req.body ?? {};

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'title is required' });
        }
        if (!assignedToId || typeof assignedToId !== 'string') {
            return res.status(400).json({ success: false, message: 'assignedToId is required' });
        }

        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        if (!(await assigneeIsActiveLabMember(lab.laboratoryId, assignedToId))) {
            return res.status(400).json({
                success: false,
                message: 'Assignee must be an active member of this laboratory',
            });
        }

        let parsedPriority: TaskPriority = TaskPriority.MEDIUM;
        if (priority !== undefined && Object.values(TaskPriority).includes(priority)) {
            parsedPriority = priority;
        }

        let parsedStatus: TaskStatus = TaskStatus.PENDING;
        if (status !== undefined && Object.values(TaskStatus).includes(status)) {
            parsedStatus = status;
        }

        let due: Date | null = null;
        if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
            const d = new Date(dueDate as string);
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid dueDate' });
            }
            due = d;
        }

        const task = await prismaClient.task.create({
            data: {
                title: title.trim(),
                description:
                    typeof description === 'string' && description.trim().length > 0 ? description.trim() : null,
                laboratoryId: lab.laboratoryId,
                experimentId: null,
                createdById: userId,
                assignedToId,
                priority: parsedPriority,
                status: parsedStatus,
                dueDate: due,
            },
            include: {
                assignedTo: { select: assignedToSelect },
                createdBy: { select: assignedToSelect },
            },
        });

        const assigner = await prismaClient.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true },
        });
        if (assigner) {
            void sendTaskAssignedEmail({
                to: task.assignedTo.email,
                taskTitle: task.title,
                priority: task.priority,
                experimentTitle: 'General laboratory task',
                laboratoryName: lab.laboratoryName,
                assignerDisplayName: formatUserDisplayName(assigner),
            }).catch((err) => console.error('Failed to send task assigned email', err));
        }

        void createTaskAssignedInAppNotification({
            actorUserId: userId,
            assigneeUserId: assignedToId,
            taskTitle: task.title,
            laboratoryId: lab.laboratoryId,
            contextLabel: `Laboratory "${lab.laboratoryName}"`,
        }).catch((err) => console.error('Failed to create task in-app notification', err));

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error('Error creating laboratory task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create laboratory task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const updateLaboratoryTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId, taskId } = req.params;
        const { title, description, assignedToId, dueDate, priority, status } = req.body ?? {};

        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                laboratoryId: lab.laboratoryId,
                experimentId: null,
            },
            select: { id: true, assignedToId: true },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (assignedToId !== undefined) {
            if (!assignedToId || typeof assignedToId !== 'string') {
                return res.status(400).json({ success: false, message: 'assignedToId must be a non-empty string' });
            }
            if (!(await assigneeIsActiveLabMember(lab.laboratoryId, assignedToId))) {
                return res.status(400).json({
                    success: false,
                    message: 'Assignee must be an active member of this laboratory',
                });
            }
        }

        const data: {
            title?: string;
            description?: string | null;
            assignedToId?: string;
            dueDate?: Date | null;
            priority?: TaskPriority;
            status?: TaskStatus;
        } = {};

        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'title cannot be empty' });
            }
            data.title = title.trim();
        }
        if (description !== undefined) {
            if (description === null) {
                data.description = null;
            } else if (typeof description === 'string') {
                data.description = description.trim().length === 0 ? null : description.trim();
            }
        }
        if (assignedToId !== undefined) {
            data.assignedToId = assignedToId;
        }
        if (priority !== undefined) {
            if (!Object.values(TaskPriority).includes(priority)) {
                return res.status(400).json({ success: false, message: 'Invalid priority' });
            }
            data.priority = priority;
        }
        if (status !== undefined) {
            if (!Object.values(TaskStatus).includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            data.status = status;
        }
        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === '') {
                data.dueDate = null;
            } else {
                const d = new Date(dueDate as string);
                if (Number.isNaN(d.getTime())) {
                    return res.status(400).json({ success: false, message: 'Invalid dueDate' });
                }
                data.dueDate = d;
            }
        }

        const task = await prismaClient.task.update({
            where: { id: taskId },
            data,
            include: {
                assignedTo: { select: assignedToSelect },
                createdBy: { select: assignedToSelect },
            },
        });

        const assigneeChanged =
            data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId;
        if (assigneeChanged) {
            const assigner = await prismaClient.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true, email: true },
            });
            if (assigner) {
                void sendTaskAssignedEmail({
                    to: task.assignedTo.email,
                    taskTitle: task.title,
                    priority: task.priority,
                    experimentTitle: 'General laboratory task',
                    laboratoryName: lab.laboratoryName,
                    assignerDisplayName: formatUserDisplayName(assigner),
                }).catch((err) => console.error('Failed to send task assigned email', err));
            }

            void createTaskAssignedInAppNotification({
                actorUserId: userId,
                assigneeUserId: data.assignedToId!,
                taskTitle: task.title,
                laboratoryId: lab.laboratoryId,
                contextLabel: `Laboratory "${lab.laboratoryName}"`,
            }).catch((err) => console.error('Failed to create task in-app notification', err));
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error('Error updating laboratory task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update laboratory task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const patchLaboratoryTaskStatus = async (req: Request, res: Response) => {
    try {
        const { userId, labId, taskId } = req.params;
        const { status } = req.body ?? {};

        const allowedStatuses = Object.values(TaskStatus) as readonly string[];
        if (status === undefined || typeof status !== 'string' || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid status value is required' });
        }

        const nextStatus = status as TaskStatus;

        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                laboratoryId: lab.laboratoryId,
                experimentId: null,
            },
            select: { id: true },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const task = await prismaClient.task.update({
            where: { id: taskId },
            data: { status: nextStatus },
            include: {
                assignedTo: { select: assignedToSelect },
                createdBy: { select: assignedToSelect },
            },
        });

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error('Error patching laboratory task status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task status',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const deleteLaboratoryTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId, taskId } = req.params;

        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                laboratoryId: lab.laboratoryId,
                experimentId: null,
            },
            select: { id: true },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await prismaClient.task.delete({ where: { id: taskId } });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting laboratory task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete laboratory task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
