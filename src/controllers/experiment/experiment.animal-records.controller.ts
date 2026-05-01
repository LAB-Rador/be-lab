import { AccessStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const getExperimentAnimalRecords = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const rawLimit = req.query.limit;
        const parsed = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : NaN;
        const take = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;

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
            select: { id: true },
        });

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: 'Experiment not found',
            });
        }

        const records = await prismaClient.animalRecord.findMany({
            where: {
                experimentId: experimentId,
            },
            take,
            orderBy: { date: 'desc' },
            include: {
                animal: {
                    select: {
                        id: true,
                        name: true,
                        identifier: true,
                    },
                },
                measurements: {
                    select: {
                        parameter: true,
                        value: true,
                        unit: true,
                    },
                },
            },
        });

        res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Error fetching experiment animal records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animal records',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
