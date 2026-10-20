import { AccessStatus, InvitationStatus, LoginTokenPurpose, type Laboratory } from '@prisma/client';
import type { Request, Response } from 'express';
import { frontendOrigin } from '../../lib/frontend-origin.js';
import { issueAuthSession } from '../../lib/issue-auth-session.js';
import { normalizeEmail } from '../../lib/normalize-email.js';
import { prismaClient } from '../../lib/prisma.js';
import { createRawToken, hashToken } from '../../lib/token-hash.js';
import { sendMagicLink } from '../../services/email/magic-link.service.js';

const SIGN_IN_TTL_MS = 15 * 60 * 1000;

class AuthLinkError extends Error {
    constructor() {
        super('This link is invalid or has expired.');
        this.name = 'AuthLinkError';
    }
}

export const requestMagicLink = async (req: Request, res: Response) => {
    try {
        const email = normalizeEmail(req.body?.email);
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'A valid email is required.',
            });
        }

        const rawToken = createRawToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + SIGN_IN_TTL_MS);

        await prismaClient.loginToken.updateMany({
            where: {
                email,
                purpose: LoginTokenPurpose.SIGN_IN,
                usedAt: null,
            },
            data: { usedAt: new Date() },
        });

        await prismaClient.loginToken.create({
            data: {
                email,
                tokenHash,
                purpose: LoginTokenPurpose.SIGN_IN,
                expiresAt,
            },
        });

        const url = `${frontendOrigin()}/auth/magic?token=${encodeURIComponent(rawToken)}`;
        await sendMagicLink(email, url);

        return res.status(200).json({
            success: true,
            message: 'If the address can receive mail, a sign-in link is on its way.',
        });
    } catch (error) {
        console.error('Error creating magic link:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send sign-in link',
        });
    }
};

export const consumeMagicLink = async (req: Request, res: Response) => {
    try {
        const rawToken = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
        if (!rawToken) {
            return res.status(400).json({
                success: false,
                message: 'This link is invalid or has expired.',
            });
        }

        const tokenHash = hashToken(rawToken);
        const result = await prismaClient.$transaction(async (tx) => {
            const fresh = await tx.loginToken.findUnique({
                where: { tokenHash },
                include: {
                    invitation: {
                        include: { laboratory: true },
                    },
                },
            });

            if (!fresh || fresh.usedAt || fresh.expiresAt <= new Date()) {
                throw new AuthLinkError();
            }

            if (fresh.purpose === LoginTokenPurpose.INVITE) {
                const invitation = fresh.invitation;
                if (
                    !invitation
                    || invitation.status !== InvitationStatus.PENDING
                    || invitation.expiresAt <= new Date()
                    || invitation.email !== fresh.email
                ) {
                    throw new AuthLinkError();
                }
            }

            const claimed = await tx.loginToken.updateMany({
                where: { id: fresh.id, usedAt: null },
                data: { usedAt: new Date() },
            });
            if (claimed.count !== 1) {
                throw new AuthLinkError();
            }

            let user = await tx.user.findUnique({ where: { email: fresh.email } });
            if (!user) {
                user = await tx.user.create({
                    data: {
                        email: fresh.email,
                        confirmedEmail: true,
                    },
                });
            } else if (!user.confirmedEmail) {
                user = await tx.user.update({
                    where: { id: user.id },
                    data: { confirmedEmail: true },
                });
            }

            let joinedLaboratory: Laboratory | null = null;
            if (fresh.purpose === LoginTokenPurpose.INVITE && fresh.invitation) {
                const invitation = fresh.invitation;
                const existing = await tx.userLaboratory.findUnique({
                    where: {
                        userId_laboratoryId: {
                            userId: user.id,
                            laboratoryId: invitation.laboratoryId,
                        },
                    },
                });

                if (!existing) {
                    await tx.userLaboratory.create({
                        data: {
                            userId: user.id,
                            laboratoryId: invitation.laboratoryId,
                            role: invitation.role,
                            invitedBy: invitation.invitedBy,
                        },
                    });
                } else if (existing.accessStatus !== AccessStatus.ACTIVE) {
                    await tx.userLaboratory.update({
                        where: { id: existing.id },
                        data: {
                            accessStatus: AccessStatus.ACTIVE,
                            role: invitation.role,
                            invitedBy: invitation.invitedBy,
                        },
                    });
                }

                await tx.invitation.update({
                    where: { id: invitation.id },
                    data: {
                        status: InvitationStatus.ACCEPTED,
                        usedAt: new Date(),
                    },
                });
                joinedLaboratory = invitation.laboratory;
            }

            return { user, joinedLaboratory };
        });

        const session = await issueAuthSession(result.user);
        return res.status(200).json({
            ...session,
            joinedLaboratory: result.joinedLaboratory
                ? {
                    id: result.joinedLaboratory.id,
                    name: result.joinedLaboratory.name,
                }
                : null,
        });
    } catch (error) {
        if (error instanceof AuthLinkError) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        console.error('Error consuming magic link:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to sign in with this link',
        });
    }
};
