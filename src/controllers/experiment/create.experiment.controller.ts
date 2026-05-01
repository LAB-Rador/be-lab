import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

export const createExperiment = async (req: Request, res: Response) => {
    try {
        const { title, description, laboratoryId, startDate, endDate, status, createdById, protocol } = req.body;

        const userLaboratory = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: createdById,
                accessStatus: AccessStatus.ACTIVE,
                laboratory: {
                    name: laboratoryId
                }
            },
            include: {
                laboratory: true
            }
        });

        if (!userLaboratory) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this laboratory'
            });
        }

        const experiment = await prismaClient.experiment.create({
            data: {
                laboratoryId: userLaboratory.laboratory.id,
                description: description,
                createdById: createdById,
                startDate: startDate,
                protocol: protocol,
                endDate: endDate,
                status: status,
                title: title,
            }
        })

        res.status(200).json({
            success: true,
            data: { ...experiment, animalCount: 0 },
            message: 'Experiment successfully created!'
        });

    } catch (error) {
        console.error('Error creating experiment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create experiment',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}