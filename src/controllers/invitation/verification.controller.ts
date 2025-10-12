import { InvitationStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import type { Request, Response } from 'express';

export const verificationInvitation = async (req: Request, res: Response) => {
    try {
        const { code, userId } = req.body;

        if (!code) {
            return res.status(200).json({
                success: false,
                message: 'Invalid or unavailable code',
            });
        }

        const user = await prismaClient.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'No user find with existing Id!',
            });
        }

        const invitation = await prismaClient.invitation.findFirst({
            where: {
                email: user.email,
                code: code,
                status: InvitationStatus.PENDING,
                expiresAt: {
                    gt: new Date(),
                }
            }
        })

        if (!invitation) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code or invitation not exist',
            });
        }

        await prismaClient.userLaboratory.create({
            data: {
                userId,
                laboratoryId: invitation.laboratoryId,
                role: invitation.role,
                invitedBy: invitation.invitedBy
            },
        });

        await prismaClient.invitation.update({
            where: {
                id: invitation.id
            },
            data: {
                status: InvitationStatus.ACCEPTED
            }
        })

        res.status(201).json({
            success: true,
            message: 'Congratulations, you have been successfully added to the lab.',
        });

    } catch (error) {
        console.error('Error Verify Invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to Verify Invitation',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}