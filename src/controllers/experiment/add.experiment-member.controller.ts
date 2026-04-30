import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const addExperimentMember = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const targetUserId = (req.body?.targetUserId as string | undefined) || (req.body?.userId as string | undefined);

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'targetUserId is required' });
        }

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
                laboratoryId: true,
            },
        });

        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        if (experiment.createdById !== userId) {
            return res.status(403).json({ success: false, message: 'Only the experiment creator can add members' });
        }

        if (targetUserId === experiment.createdById) {
            return res.status(400).json({ success: false, message: 'Creator is already on this experiment' });
        }

        const labMembership = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: targetUserId,
                laboratoryId: experiment.laboratoryId,
                accessStatus: AccessStatus.ACTIVE,
            },
        });

        if (!labMembership) {
            return res.status(400).json({ success: false, message: 'User is not an active member of this laboratory' });
        }

        const member = await prismaClient.experimentMember.create({
            data: {
                experimentId: experiment.id,
                userId: targetUserId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        laboratories: {
                            where: { laboratory: { name: labId } },
                            select: { role: true },
                        },
                    },
                },
            },
        });

        res.status(201).json({ success: true, data: member });
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
            return res.status(409).json({ success: false, message: 'User is already added to this experiment' });
        }
        console.error('Error adding experiment member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add experiment member',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
