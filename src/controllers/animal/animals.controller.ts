import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

const animalsClient = prismaClient.animal;

export const getAllAnimals = async (req: Request, res: Response) => {
    try {
        const { userId, labId, rows, page, filters } = req.params;
        const rowsNumber = parseInt(rows);
        const pageNumber = parseInt(page);
        let parsedFilters = null;
        if (filters && filters !== 'null' && filters !== 'undefined') {
            try {
                parsedFilters = JSON.parse(decodeURIComponent(filters));
            } catch (error) {
                console.error('Error parsing filters:', error);
            }
        }
        
        const whereCondition: any = {
            laboratory: {
                name: labId,
                users: {
                    some: {
                        userId: userId,
                        accessStatus: AccessStatus.ACTIVE
                    }
                }
            }
        };
        
        if (parsedFilters) {
            if (parsedFilters.animalTypes && Array.isArray(parsedFilters.animalTypes) && parsedFilters.animalTypes.length > 0) {
                const validTypes = parsedFilters.animalTypes.filter((type: any) => type && typeof type === 'string');
                if (validTypes.length > 0) {
                    whereCondition.animalType = {
                        name: {
                            in: validTypes
                        }
                    };
                }
            }
            
            if (parsedFilters.statuses && Array.isArray(parsedFilters.statuses) && parsedFilters.statuses.length > 0) {
                const validStatuses = parsedFilters.statuses.filter((status: any) => status && typeof status === 'string');
                if (validStatuses.length > 0) {
                    whereCondition.status = {
                        in: validStatuses
                    };
                }
            }
            
            if (parsedFilters.sex && parsedFilters.sex !== null && typeof parsedFilters.sex === 'string') {
                whereCondition.sex = parsedFilters.sex;
            }
            
            if (parsedFilters.ageGroups && Array.isArray(parsedFilters.ageGroups) && parsedFilters.ageGroups.length > 0) {
                const now = new Date();
                const ageConditions = [];
                
                for (const ageGroup of parsedFilters.ageGroups) {
                    if (!ageGroup || typeof ageGroup !== 'string') continue;
                    switch (ageGroup) {
                        case 'JUVENILE': {
                            const juvenileStart = new Date(now);
                            juvenileStart.setMonth(now.getMonth() - 3);
                            ageConditions.push({
                                birthDate: {
                                    gte: juvenileStart,
                                    lte: now
                                }
                            });
                            break;
                        }
                            
                        case 'YOUNG_ADULT': {
                            const youngAdultStart = new Date(now);
                            const youngAdultEnd = new Date(now);
                            youngAdultStart.setMonth(now.getMonth() - 6);
                            youngAdultEnd.setMonth(now.getMonth() - 3);
                            ageConditions.push({
                                birthDate: {
                                    gte: youngAdultStart,
                                    lt: youngAdultEnd
                                }
                            });
                            break;
                        }
                            
                        case 'ADULT': {
                            const adultStart = new Date(now);
                            const adultEnd = new Date(now);
                            adultStart.setMonth(now.getMonth() - 9);
                            adultEnd.setMonth(now.getMonth() - 6);
                            ageConditions.push({
                                birthDate: {
                                    gte: adultStart,
                                    lt: adultEnd
                                }
                            });
                            break;
                        }
                            
                        case 'SENIOR': {
                            const seniorEnd = new Date(now);
                            seniorEnd.setMonth(now.getMonth() - 9);
                            ageConditions.push({
                                birthDate: {
                                    lt: seniorEnd
                                }
                            });
                            break;
                        }
                    }
                }
                
                if (ageConditions.length > 0) {
                    whereCondition.OR = ageConditions;
                }
            }
        }
        
        const animals = await animalsClient.findMany({
            where: whereCondition,
            skip: (pageNumber - 1) * rowsNumber,
            take: rowsNumber,
            include: {
                animalType: true,
                laboratory: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                photos: true,
                customFields: {
                    include: {
                        customField: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        const totalCount = await animalsClient.count({
            where: whereCondition
        });
        
        const totalPages = Math.ceil(totalCount / rowsNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPreviousPage = pageNumber > 1;
        
        res.status(200).json({ 
            success: true, 
            data: animals,
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
        console.error('Error fetching animals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animals',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};