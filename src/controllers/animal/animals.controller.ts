import { Request, Response } from 'express';
import prismaClient from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';

const animalsClient = prismaClient.animal;

export const getAllAnimals = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        
        // Находим животных из лаборатории с указанным именем (labId),
        // к которой принадлежит пользователь
        const animals = await animalsClient.findMany({
            where: {
                laboratory: {
                    name: labId, // labId это имя лаборатории
                    users: {
                        some: {
                            userId: userId, // проверяем что пользователь принадлежит к этой лаборатории
                            accessStatus: AccessStatus.ACTIVE // и имеет активный доступ
                        }
                    }
                }
            },
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
            }
        });
        
        res.status(200).json({ success: true, data: animals });
    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animals',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};