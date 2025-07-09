import { Request, Response } from 'express';
import prismaClient from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

export const getAnimalTypes = async (req: Request, res: Response) => {
    try {
        const { labId, userId } = req.params;

        // Check if user has access to this laboratory (labId is laboratory name)
        const userLaboratory = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: userId,
                accessStatus: AccessStatus.ACTIVE,
                laboratory: {
                    name: labId // labId это имя лаборатории
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

        // Get animal types for this laboratory using the laboratory ID
        const animalTypes = await prismaClient.animalType.findMany({
            where: {
                laboratoryId: userLaboratory.laboratory.id
            },
            include: {
                customFields: {
                    orderBy: {
                        name: 'asc'
                    }
                },
                _count: {
                    select: {
                        animals: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json({
            success: true,
            data: animalTypes
        });
    } catch (error) {
        console.error('Error fetching animal types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animal types',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAnimalTypeById = async (req: Request, res: Response) => {
    try {
        const { animalTypeId } = req.params;

        const animalType = await prismaClient.animalType.findUnique({
            where: {
                id: animalTypeId
            },
            include: {
                customFields: {
                    orderBy: {
                        name: 'asc'
                    }
                },
                laboratory: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        animals: true
                    }
                }
            }
        });

        if (!animalType) {
            return res.status(404).json({
                success: false,
                message: 'Animal type not found'
            });
        }

        res.status(200).json({
            success: true,
            data: animalType
        });
    } catch (error) {
        console.error('Error fetching animal type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animal type',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}; 