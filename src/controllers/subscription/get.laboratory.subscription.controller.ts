import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { AccessStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const getLaboratorySubscription = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const subscription = await prismaClient.subscription.findFirst({
            where: { laboratoryId: lab.laboratoryId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                maxUsers: true,
                autoRenew: true,
                plan: {
                    select: {
                        name: true,
                        price: true,
                        currency: true,
                        billingCycle: true,
                    },
                },
            },
        });

        const memberCount = await prismaClient.userLaboratory.count({
            where: {
                laboratoryId: lab.laboratoryId,
                accessStatus: AccessStatus.ACTIVE,
            },
        });

        return res.status(200).json({
            success: true,
            data: { memberCount, subscription },
        });
    } catch (error) {
        console.error('Error fetching laboratory subscription:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch laboratory subscription' });
    }
};
