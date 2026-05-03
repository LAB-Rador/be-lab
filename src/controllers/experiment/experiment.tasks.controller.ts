import { createTaskAssignedInAppNotification } from '../../services/notification/task-assigned-in-app.service.js';
import { sendTaskAssignedEmail } from '../../services/email/task-assigned-notification.service.js';
import { formatUserDisplayName } from '../../lib/format-user-display-name.js';
import { AccessStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

type ExperimentGate = {
    id: string;
    laboratoryId: string;
    createdById: string;
    title: string;
    laboratory: { name: string };
    members: { userId: string }[];
};

async function loadExperimentWithAccessGate(
    userId: string,
    labId: string,
    experimentId: string,
): Promise<ExperimentGate | null> {
    const experiment = await prismaClient.experiment.findFirst({
        where: {
            id: experimentId,
            laboratory: {
                name: labId,
                users: {
                    some: {
                        userId,
                        accessStatus: AccessStatus.ACTIVE,
                    },
                },
            },
            OR: [{ createdById: userId }, { members: { some: { userId } } }],
        },
        select: {
            id: true,
            laboratoryId: true,
            createdById: true,
            title: true,
            laboratory: { select: { name: true } },
            members: { select: { userId: true } },
        },
    });

    return experiment ?? null;
}

function assigneeAllowed(experiment: ExperimentGate, assignedToId: string): boolean {
    if (experiment.createdById === assignedToId) {
        return true;
    }
    return experiment.members.some((m) => m.userId === assignedToId);
}

const assignedToSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
};

export const getPaginatedExperimentTasks = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '10'), 10)));

        const experiment = await loadExperimentWithAccessGate(userId, labId, experimentId);
        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const where = {
            experimentId: experiment.id,
            laboratoryId: experiment.laboratoryId,
        };

        const totalCount = await prismaClient.task.count({ where });

        const items = await prismaClient.task.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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
        console.error('Error fetching experiment tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiment tasks',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const createExperimentTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const { title, description, assignedToId, dueDate, priority, status } = req.body ?? {};

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'title is required' });
        }
        if (!assignedToId || typeof assignedToId !== 'string') {
            return res.status(400).json({ success: false, message: 'assignedToId is required' });
        }

        const experiment = await loadExperimentWithAccessGate(userId, labId, experimentId);
        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        if (!assigneeAllowed(experiment, assignedToId)) {
            return res.status(400).json({
                success: false,
                message: 'Assignee must be the experiment creator or an experiment member',
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
                laboratoryId: experiment.laboratoryId,
                experimentId: experiment.id,
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
                experimentTitle: experiment.title,
                laboratoryName: experiment.laboratory.name,
                assignerDisplayName: formatUserDisplayName(assigner),
            }).catch((err) => console.error('Failed to send task assigned email', err));
        }

        void createTaskAssignedInAppNotification({
            actorUserId: userId,
            assigneeUserId: assignedToId,
            taskTitle: task.title,
            laboratoryId: experiment.laboratoryId,
            contextLabel: `Experiment "${experiment.title}"`,
        }).catch((err) => console.error('Failed to create task in-app notification', err));

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error('Error creating experiment task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create experiment task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const updateExperimentTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, taskId } = req.params;
        const { title, description, assignedToId, dueDate, priority, status } = req.body ?? {};

        const experiment = await loadExperimentWithAccessGate(userId, labId, experimentId);
        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                experimentId: experiment.id,
                laboratoryId: experiment.laboratoryId,
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
            if (!assigneeAllowed(experiment, assignedToId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Assignee must be the experiment creator or an experiment member',
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
                    experimentTitle: experiment.title,
                    laboratoryName: experiment.laboratory.name,
                    assignerDisplayName: formatUserDisplayName(assigner),
                }).catch((err) => console.error('Failed to send task assigned email', err));
            }

            void createTaskAssignedInAppNotification({
                actorUserId: userId,
                assigneeUserId: data.assignedToId!,
                taskTitle: task.title,
                laboratoryId: experiment.laboratoryId,
                contextLabel: `Experiment "${experiment.title}"`,
            }).catch((err) => console.error('Failed to create task in-app notification', err));
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error('Error updating experiment task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update experiment task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/** Partial update: status only (fast toggle from the tasks table). */
export const patchExperimentTaskStatus = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, taskId } = req.params;
        const { status } = req.body ?? {};

        const allowedStatuses = Object.values(TaskStatus) as readonly string[];
        if (status === undefined || typeof status !== 'string' || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Valid status value is required' });
        }

        const nextStatus = status as TaskStatus;

        const experiment = await loadExperimentWithAccessGate(userId, labId, experimentId);
        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                experimentId: experiment.id,
                laboratoryId: experiment.laboratoryId,
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
        console.error('Error patching experiment task status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task status',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const deleteExperimentTask = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, taskId } = req.params;

        const experiment = await loadExperimentWithAccessGate(userId, labId, experimentId);
        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const existing = await prismaClient.task.findFirst({
            where: {
                id: taskId,
                experimentId: experiment.id,
                laboratoryId: experiment.laboratoryId,
            },
            select: { id: true },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await prismaClient.task.delete({ where: { id: taskId } });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting experiment task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete experiment task',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
