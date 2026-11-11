import type { Request, Response } from 'express';
import { AccessStatus, Role, SubscriptionStatus } from '@prisma/client';
import { ensureFreePlan } from '../../lib/free-plan.js';
import { useCaller } from '../../middleware/require-user.js';
import { prismaClient } from '../../lib/prisma.js';

function text(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

export const createLaboratory = async (req: Request, res: Response) => {
    const userId = useCaller(req, res, req.body?.userId);
    if (!userId) return;

    const name = text(req.body?.name);
    const username = text(req.body?.username);
    const position = text(req.body?.position);
    const description = text(req.body?.description);
    if (!name || !username || !position) {
        return res.status(400).json({
            success: false,
            message: 'Name, username, and position are required.',
        });
    }

    let freePlan: { id: string; maxUsers: number };
    try {
        freePlan = await ensureFreePlan();
        const ownedLaboratories = await prismaClient.userLaboratory.count({
            where: {
                userId,
                role: Role.OWNER,
                accessStatus: AccessStatus.ACTIVE,
            },
        });
        if (ownedLaboratories >= 1) {
            return res.status(409).json({
                success: false,
                message: 'The Free plan includes one laboratory.',
            });
        }
    } catch (error) {
        console.error('Error checking laboratory limit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create laboratory',
        });
    }

    try {
        const existingLab = await prismaClient.laboratory.findFirst({
            where: {
                name,
                users: {
                    some: {
                        userId,
                    },
                },
            },
        });

        if (existingLab) {
            return res.status(409).json({
                success: false,
                message: 'You already have a laboratory with this name!',
            });
        }
    } catch (error) {
        console.error('Error checking existing laboratory:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create laboratory',
        });
    }

    try {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const laboratory = await prismaClient.laboratory.create({
            data: {
                name,
                username,
                position,
                description: description || null,
                users: {
                    create: {
                        userId,
                        role: Role.OWNER,
                    },
                },
                subscriptions: {
                    create: {
                        planId: freePlan.id,
                        startDate,
                        endDate,
                        status: SubscriptionStatus.ACTIVE,
                        maxUsers: freePlan.maxUsers,
                        autoRenew: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: laboratory,
            message: 'Laboratory created successfully!',
        });
    } catch (error) {
        console.error('Error create laboratory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create laboratory',
        });
    }
};
