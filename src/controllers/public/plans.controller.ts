import type { Request, Response } from 'express';
import { PRICE_CARD, ensurePriceCard } from '../../lib/price-card.js';
import { prismaClient } from '../../lib/prisma.js';

const PLAN_ORDER = new Map(PRICE_CARD.map((plan, index) => [plan.name, index]));

export const getPublicPlans = async (_req: Request, res: Response) => {
    try {
        await ensurePriceCard();
        const plans = await prismaClient.plan.findMany({
            where: {
                isActive: true,
                name: { in: PRICE_CARD.map((plan) => plan.name) },
            },
            select: {
                name: true,
                price: true,
                maxUsers: true,
                features: true,
            },
        });
        plans.sort((left, right) => (PLAN_ORDER.get(left.name) ?? 0) - (PLAN_ORDER.get(right.name) ?? 0));
        return res.status(200).json({ success: true, data: plans });
    } catch (error) {
        console.error('Error loading public plans:', error);
        return res.status(500).json({ success: false, message: 'Failed to load plans' });
    }
};
