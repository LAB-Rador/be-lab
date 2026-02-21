import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';


export const getUniqueExperimentById = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;

        const experiment = await prismaClient.experiment.findUnique({
            where: {
                id: experimentId,
                laboratory: {
                    name: labId,
                    users: {
                        some: {
                            userId: userId,
                            accessStatus: AccessStatus.ACTIVE
                        }
                    }
                }
            },
            include: {
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true }
                },
                animals: {
                    include: {
                        animal: true
                    }
                },
                tasks: true
            }
        });

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: 'Experiment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: experiment
        });
    } catch (error) {
        console.error('Error fetching experiment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiment',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}