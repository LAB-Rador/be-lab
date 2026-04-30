import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

const memberInclude = (labId: string) => ({
    user: {
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            laboratories: {
                where: {
                    laboratory: { name: labId },
                },
                select: { role: true },
            },
        },
    },
});

export const getUniqueExperimentById = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;

        const experiment = await prismaClient.experiment.findFirst({
            where: {
                id: experimentId,
                laboratory: {
                    name: labId,
                    users: {
                        some: {
                            userId: userId,
                            accessStatus: AccessStatus.ACTIVE,
                        },
                    },
                },
                OR: [{ createdById: userId }, { members: { some: { userId } } }],
            },
            include: {
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                members: {
                    include: memberInclude(labId),
                },
                animals: {
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
                },
                tasks: true,
            },
        });

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: 'Experiment not found',
            });
        }

        const { animals: experimentAnimalRows, ...experimentRest } = experiment;
        const data = {
            ...experimentRest,
            animals: experimentAnimalRows.map((row) => ({
                ...row.animal,
                experimentAnimalId: row.id,
                experimentNotes: row.notes,
            })),
        };

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error fetching experiment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiment',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
