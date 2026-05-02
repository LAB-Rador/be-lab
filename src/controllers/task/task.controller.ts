import { AccessStatus, TaskStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const taskClient = prismaClient.task;

export const getAllPendingTasks = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        
        const tasksCount = await taskClient.findMany({
            where: {
                laboratory: {
                    name: labId,
                    users: {
                        some: {
                            userId: userId,
                            accessStatus: AccessStatus.ACTIVE
                        }
                    }
                },
                status: TaskStatus.PENDING
            },
            include: {
                assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
                createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        })

        res.status(200).json({ success: true, data: tasksCount });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}