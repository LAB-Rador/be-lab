import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

const animalsClient = prismaClient;

export const getUniqueAnimalById = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalId, rows, page } = req.params;
        const rowsNumber = parseInt(rows);
        const pageNumber = parseInt(page);

        // First check if user has access to this laboratory
        const userLaboratory = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: userId,
                accessStatus: AccessStatus.ACTIVE,
                laboratory: {
                    name: labId
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

        const whereCondition: any = {
            laboratoryId: userLaboratory.laboratory.id
        };

        // const whereCondition: any = {
        //     laboratory: {
        //         name: labId,
        //         users: {
        //             some: {
        //                 userId: userId,
        //                 accessStatus: AccessStatus.ACTIVE
        //             }
        //         }
        //     }
        // };

        const animal = await animalsClient.animal.findUnique({
            where: {
                id: animalId,
                ...whereCondition
            },
            include: {
                animalType: true,
                records: {
                    skip: (pageNumber - 1) * rowsNumber,
                    take: rowsNumber,
                    include: {
                        measurements: true
                    }
                }
            },
        });
        
        if (!animal) {
            return res.status(404).json({
                success: false,
                message: 'Animal not found'
            });
        }

        const totalCount = await animalsClient.animalRecord.count({
            where: {
                animalId: animalId
            }
        });
        
        const totalPages = Math.ceil(totalCount / rowsNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPreviousPage = pageNumber > 1;
        
        res.status(200).json({
            message: 'Animal fetched successfully',
            success: true,
            data: animal,
            pagination: {
                currentPage: pageNumber,
                pageSize: rowsNumber,
                totalCount: totalCount,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage
            }
        });
    } catch (error) {
        console.error('Error fetching animal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animal',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
