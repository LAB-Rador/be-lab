import sendInvitationCode from '../../services/email/invitation.service.js';
import generateCode from '../../lib/codeGenerator.js';
import { prismaClient } from '../../lib/prisma.js';
import type { Request, Response } from 'express';

export const createInvitation = async (req: Request, res: Response) => {
    try {
        const { email, labId, role, invitedBy } = req.body;
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
        const code = await generateCode();

        const laboratory = await prismaClient.laboratory.findFirst({
            where: {
                name: labId
            }
        })

        if(!laboratory) {
            return res.status(403).json({
                success: false,
                error: 'Failed to create Invitation',
            });
        }

        const invitation = await prismaClient.invitation.create({
            data: {
                expiresAt: new Date(Date.now() + TEN_DAYS_MS),
                invitedBy: invitedBy,
                laboratoryId: laboratory?.id,
                email: email,
                code: code,
                role: role,
                token: 'token',
            }
        });

        if(!invitation) {
            return res.status(403).json({
                success: false,
                error: 'Failed to create Invitation',
            });
        }

        await sendInvitationCode(email, code, labId, role);
        res.status(201).json({ success: true, message: 'Invitation created successfuly' });

    } catch (error) {
        console.error('Error create Invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Invitation',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}