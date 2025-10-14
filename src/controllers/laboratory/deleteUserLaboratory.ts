import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus, Role } from '@prisma/client';
import { Response, Request } from 'express';

export const deleteLaboratoryMember = async (req: Request, res: Response) => {
    try {
        const { userId: ownerUserId, labId, userLabId } = req.params;

        // Проверяем, что пользователь, который пытается удалить, является владельцем лаборатории
        const ownerLaboratory = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: ownerUserId,
                accessStatus: AccessStatus.ACTIVE,
                role: Role.OWNER,
                laboratory: {
                    name: labId
                }
            },
            include: {
                laboratory: true
            }
        });

        if (!ownerLaboratory) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only laboratory owner can remove members'
            });
        }

        // Проверяем, что участник существует в лаборатории
        const memberToDelete = await prismaClient.userLaboratory.findFirst({
            where: {
                id: userLabId,
                laboratoryId: ownerLaboratory.laboratory.id,
                accessStatus: AccessStatus.ACTIVE
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!memberToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this laboratory'
            });
        }

        // Проверяем, что владелец не пытается удалить сам себя
        if (ownerUserId === memberToDelete.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Owner cannot remove themselves from the laboratory'
            });
        }

        // Удаляем участника из лаборатории
        await prismaClient.userLaboratory.delete({
            where: {
                id: memberToDelete.id
            }
        });

        const invitationToDelete = await prismaClient.invitation.findFirst({
            where: {
                laboratoryId: ownerLaboratory.laboratory.id,
                email: memberToDelete.user.email
            }
        })

        if (!invitationToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this invitation list'
            });
        }

        await prismaClient.invitation.delete({
            where: {
                id: invitationToDelete.id
            }
        })

        return res.status(200).json({
            success: true,
            message: `Member ${memberToDelete.user.email} has been successfully removed from laboratory`,
            data: {
                removedMember: {
                    id: memberToDelete.user.id,
                    email: memberToDelete.user.email,
                    firstName: memberToDelete.user.firstName,
                    lastName: memberToDelete.user.lastName
                }
            }
        });
        
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error deleting laboratory member:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}