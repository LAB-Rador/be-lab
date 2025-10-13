import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Response, Request } from 'express';

export const getAllLaboratoryMembers = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;

        // Проверяем, что пользователь имеет доступ к лаборатории
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

        // Получаем всех пользователей лаборатории с включением данных пользователей
        const laboratoryMembers = await prismaClient.userLaboratory.findMany({
            where: {
                laboratoryId: userLaboratory.laboratory.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        address: true,
                        contactPhone: true,
                        institution: true,
                        confirmedEmail: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: laboratoryMembers,
            message: 'Laboratory members retrieved successfully'
        });
        
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error getting laboratory members:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
