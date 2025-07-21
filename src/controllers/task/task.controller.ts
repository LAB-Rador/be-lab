import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus, TaskStatus } from '@prisma/client';

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