import { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { formatUserDisplayName } from '../../lib/format-user-display-name.js';
import {
    sendExperimentMemberRemovedEmail,
} from '../../services/email/experiment-member-notification.service.js';

export const removeExperimentMember = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId, targetUserId } = req.params;

        const experiment = await prismaClient.experiment.findFirst({
            where: {
                id: experimentId,
                laboratory: {
                    name: labId,
                    users: {
                        some: {
                            userId,
                            accessStatus: AccessStatus.ACTIVE,
                        },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                createdById: true,
                laboratory: { select: { name: true } },
            },
        });

        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const canRemove = experiment.createdById === userId || targetUserId === userId;

        if (!canRemove) {
            return res.status(403).json({ success: false, message: 'Not allowed to remove this member' });
        }

        if (targetUserId === experiment.createdById) {
            return res.status(400).json({ success: false, message: 'Cannot remove the experiment creator' });
        }

        const membershipRow = await prismaClient.experimentMember.findFirst({
            where: {
                experimentId: experiment.id,
                userId: targetUserId,
            },
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
            },
        });

        if (!membershipRow) {
            return res.status(404).json({ success: false, message: 'Member not found on this experiment' });
        }

        await prismaClient.experimentMember.delete({
            where: { id: membershipRow.id },
        });

        const actor = await prismaClient.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true },
        });

        if (actor) {
            void sendExperimentMemberRemovedEmail({
                to: membershipRow.user.email,
                experimentTitle: experiment.title,
                laboratoryName: experiment.laboratory.name,
                actor: { displayName: formatUserDisplayName(actor) },
            }).catch((err) => console.error('Failed to send experiment member removed email', err));
        }

        res.status(200).json({ success: true, data: { removed: true } });
    } catch (error) {
        console.error('Error removing experiment member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove experiment member',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
