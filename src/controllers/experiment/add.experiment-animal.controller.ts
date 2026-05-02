import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const addExperimentAnimal = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const animalId = req.body?.animalId as string | undefined;

        if (!animalId) {
            return res.status(400).json({ success: false, message: 'animalId is required' });
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
            return res.status(403).json({ success: false, message: 'Only the experiment creator can add animals' });
        }

        const animal = await prismaClient.animal.findFirst({
            where: {
                id: animalId,
                laboratoryId: experiment.laboratoryId,
            },
        });

        if (!animal) {
            return res.status(400).json({ success: false, message: 'Animal not found in this laboratory' });
        }

        const row = await prismaClient.experimentAnimal.create({
            data: {
                experimentId: experiment.id,
                animalId,
            },
            include: {
                animal: {
                    include: {
                        animalType: true,
                        laboratory: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: {
                ...row.animal,
                experimentAnimalId: row.id,
                experimentNotes: row.notes,
            },
        });
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Animal is already in this experiment' });
        }
        console.error('Error adding experiment animal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add animal to experiment',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
