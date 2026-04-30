import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const removeExperimentMember = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, targetUserId } = req.params;

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
            },
            select: {
                id: true,
                createdById: true,
            },
        });

        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const canRemove = experiment.createdById === userId || targetUserId === userId;

        if (!canRemove) {
            return res.status(403).json({ success: false, message: 'Not allowed to remove this member' });
        }

        if (targetUserId === experiment.createdById) {
            return res.status(400).json({ success: false, message: 'Cannot remove the experiment creator' });
        }

        const deleted = await prismaClient.experimentMember.deleteMany({
            where: {
                experimentId: experiment.id,
                userId: targetUserId,
            },
        });

        if (deleted.count === 0) {
            return res.status(404).json({ success: false, message: 'Member not found on this experiment' });
        }

        res.status(200).json({ success: true, data: { removed: true } });
    } catch (error) {
        console.error('Error removing experiment member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove experiment member',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
