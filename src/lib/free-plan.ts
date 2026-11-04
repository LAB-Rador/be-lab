import { BillingCycle } from '@prisma/client';
import { prismaClient } from './prisma.js';

export const FREE_PLAN_MAX_USERS = 1;

export async function ensureFreePlan() {
    const existing = await prismaClient.plan.findFirst({
        where: { name: 'Free', isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, maxUsers: true, currency: true, price: true, billingCycle: true },
    });

    if (!existing) {
        return prismaClient.plan.create({
            data: {
                name: 'Free',
                price: 0,
                currency: 'USD',
                billingCycle: BillingCycle.YEARLY,
                maxUsers: FREE_PLAN_MAX_USERS,
                isActive: true,
            },
            select: { id: true, maxUsers: true },
        });
    }

    const aligned = existing.maxUsers === FREE_PLAN_MAX_USERS
        && existing.currency === 'USD'
        && existing.price === 0
        && existing.billingCycle === BillingCycle.YEARLY;

    if (aligned) {
        return { id: existing.id, maxUsers: existing.maxUsers };
    }

    const updated = await prismaClient.plan.update({
        where: { id: existing.id },
        data: {
            price: 0,
            currency: 'USD',
            billingCycle: BillingCycle.YEARLY,
            maxUsers: FREE_PLAN_MAX_USERS,
        },
        select: { id: true, maxUsers: true },
    });

    await prismaClient.subscription.updateMany({
        where: { planId: updated.id },
        data: { maxUsers: FREE_PLAN_MAX_USERS },
    });

    return updated;
}
