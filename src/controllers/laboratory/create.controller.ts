import type { Request, Response } from 'express';
import { BillingCycle, Role, SubscriptionStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';

export const createLaboratory = async (req: Request, res: Response) => {
    const { userId, name, ...labData } = req.body;

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
            return res.status(200).json({
                success: false,
                message: 'You already have a laboratory with this name!',
            });
        }
    } catch (error) {
        console.error('Error checking existing laboratory:', error);
        return res.status(200).json({
            success: false,
            message: 'You already have a laboratory with this name!',
        });
    }

    try {
        let freePlan = await prismaClient.plan.findFirst({
            where: { name: 'Free', isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true, maxUsers: true },
        });
        if (!freePlan) {
            freePlan = await prismaClient.plan.create({
                data: {
                    name: 'Free',
                    price: 0,
                    currency: 'CAD',
                    billingCycle: BillingCycle.MONTHLY,
                    maxUsers: 3,
                    isActive: true,
                },
                select: { id: true, maxUsers: true },
            });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const laboratory = await prismaClient.laboratory.create({
            data: {
                name,
                ...labData,
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
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
