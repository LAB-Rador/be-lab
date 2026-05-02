import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

const experimentClient = prismaClient.experiment;

export const getAllExperiments = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const includeArchived = req.query.includeArchived === 'true';

        const experiments = await experimentClient.findMany({
            where: {
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
                ...(includeArchived ? {} : { archivedAt: null }),
            },
            include: {
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { animals: true },
                },
            },
        });

        const data = experiments.map(({ _count, ...rest }) => ({
            ...rest,
            animalCount: _count.animals,
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching experiments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiments',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
