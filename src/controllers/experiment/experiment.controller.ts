import { Request, Response } from 'express';
import prismaClient from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

const experimentClient = prismaClient.experiment;

export const getAllExperimentCount = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;

        const experimentsCount = await experimentClient.count({
            where: {
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
        })
        
        res.status(200).json({ success: true, data: experimentsCount });
    } catch (error) {
        console.error('Error fetching experiments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiments',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};