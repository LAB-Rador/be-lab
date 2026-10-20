import {
    AccessStatus,
    InvitationStatus,
    LoginTokenPurpose,
    Prisma,
    Role,
} from '@prisma/client';
import type { Request, Response } from 'express';
import sendInvitationLink from '../../services/email/invitation.service.js';
import { frontendOrigin } from '../../lib/frontend-origin.js';
import { normalizeEmail } from '../../lib/normalize-email.js';
import { prismaClient } from '../../lib/prisma.js';
import { createRawToken, hashToken } from '../../lib/token-hash.js';
import { splitFullName } from '../../lib/split-full-name.js';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function isRole(value: unknown): value is Role {
    return typeof value === 'string' && (Object.values(Role) as string[]).includes(value);
}

export const createInvitation = async (req: Request, res: Response) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const invitedBy = typeof req.body?.invitedBy === 'string' ? req.body.invitedBy : '';
        const labName = typeof req.body?.labId === 'string' ? req.body.labId.trim() : '';
        const role = req.body?.role;
        const name = splitFullName(req.body?.fullName);

        if (!email || !invitedBy || !labName || !isRole(role) || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, full name, role, laboratory, and inviter are required.',
            });
        }

        const inviter = await prismaClient.user.findUnique({
            where: { id: invitedBy },
        });
        if (!inviter) {
            return res.status(403).json({
                success: false,
                message: 'Failed to create Invitation',
            });
        }

        const membership = await prismaClient.userLaboratory.findFirst({
            where: {
                userId: invitedBy,
                accessStatus: AccessStatus.ACTIVE,
                laboratory: { name: labName },
            },
            include: { laboratory: true },
        });
        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Failed to create Invitation',
            });
        }

        const existingUser = await prismaClient.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            const alreadyMember = await prismaClient.userLaboratory.findUnique({
                where: {
                    userId_laboratoryId: {
                        userId: existingUser.id,
                        laboratoryId: membership.laboratoryId,
                    },
                },
            });
            if (alreadyMember?.accessStatus === AccessStatus.ACTIVE) {
                return res.status(409).json({
                    success: false,
                    message: 'This person is already a member of the laboratory.',
                });
            }
        }

        const pending = await prismaClient.invitation.findFirst({
            where: {
                email,
                laboratoryId: membership.laboratoryId,
                status: InvitationStatus.PENDING,
            },
        });

        const rawToken = createRawToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + TEN_DAYS_MS);

        let invitationId: string;
        if (pending) {
            invitationId = pending.id;
            await prismaClient.loginToken.updateMany({
                where: {
                    invitationId: pending.id,
                    usedAt: null,
                },
                data: { usedAt: new Date() },
            });
            await prismaClient.invitation.update({
                where: { id: pending.id },
                data: {
                    role,
                    invitedBy,
                    expiresAt,
                    token: tokenHash,
                    code: tokenHash,
                    firstName: name.firstName,
                    lastName: name.lastName,
                },
            });
        } else {
            const created = await prismaClient.invitation.create({
                data: {
                    email,
                    code: tokenHash,
                    laboratoryId: membership.laboratoryId,
                    invitedBy,
                    role,
                    token: tokenHash,
                    expiresAt,
                    firstName: name.firstName,
                    lastName: name.lastName,
                },
            });
            invitationId = created.id;
        }

        await prismaClient.loginToken.create({
            data: {
                email,
                tokenHash,
                purpose: LoginTokenPurpose.INVITE,
                invitationId,
                expiresAt,
            },
        });

        const url = `${frontendOrigin()}/auth/magic?token=${encodeURIComponent(rawToken)}`;
        await sendInvitationLink(email, url, membership.laboratory.name, role);

        return res.status(201).json({
            success: true,
            message: 'Invitation created successfuly',
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'An invitation for this email is already pending.',
            });
        }
        console.error('Error create Invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Invitation',
        });
    }
};
