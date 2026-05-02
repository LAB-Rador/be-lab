import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const removeExperimentAnimal = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, animalId } = req.params;

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

        if (experiment.createdById !== userId) {
            return res.status(403).json({ success: false, message: 'Only the experiment creator can remove animals' });
        }

        const deleted = await prismaClient.experimentAnimal.deleteMany({
            where: {
                experimentId: experiment.id,
                animalId,
            },
        });

        if (deleted.count === 0) {
            return res.status(404).json({ success: false, message: 'Animal is not linked to this experiment' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error removing experiment animal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove animal from experiment',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
