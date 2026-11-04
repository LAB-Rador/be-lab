import { BillingCycle, Prisma } from '@prisma/client';
import { prismaClient } from './prisma.js';

type CardPlan = {
    name: string;
    price: number;
    maxUsers: number;
    items: string[];
};

const PAID_ITEMS = [
    '1 laboratory',
    'Experiments',
    'Tasks',
    'Notifications',
    'Saved reports',
    'Export',
    'Email support',
];

export const PRICE_CARD: CardPlan[] = [
    {
        name: 'Free',
        price: 0,
        maxUsers: 1,
        items: ['1 laboratory', 'Animal records', 'Breeding pairs', 'Basic reports', 'Email support'],
    },
    { name: 'Starter', price: 399, maxUsers: 2, items: PAID_ITEMS },
    { name: 'Lab', price: 549, maxUsers: 5, items: PAID_ITEMS },
    { name: 'Group', price: 799, maxUsers: 10, items: PAID_ITEMS },
    { name: 'Team', price: 999, maxUsers: 15, items: PAID_ITEMS },
];

function sameItems(features: Prisma.JsonValue, items: string[]) {
    if (!features || typeof features !== 'object' || Array.isArray(features)) return false;
    const current = (features as { items?: unknown }).items;
    if (!Array.isArray(current) || current.length !== items.length) return false;
    return current.every((item, index) => item === items[index]);
}

export async function ensurePriceCard() {
    for (const plan of PRICE_CARD) {
        const existing = await prismaClient.plan.findFirst({
            where: { name: plan.name, isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                price: true,
                currency: true,
                billingCycle: true,
                maxUsers: true,
                features: true,
            },
        });
        const features = { items: plan.items };
        if (!existing) {
            await prismaClient.plan.create({
                data: {
                    name: plan.name,
                    price: plan.price,
                    currency: 'USD',
                    billingCycle: BillingCycle.YEARLY,
                    maxUsers: plan.maxUsers,
                    isActive: true,
                    features,
                },
            });
            continue;
        }

        const aligned = existing.price === plan.price
            && existing.currency === 'USD'
            && existing.billingCycle === BillingCycle.YEARLY
            && existing.maxUsers === plan.maxUsers
            && sameItems(existing.features, plan.items);
        if (aligned) continue;

        await prismaClient.plan.update({
            where: { id: existing.id },
            data: {
                price: plan.price,
                currency: 'USD',
                billingCycle: BillingCycle.YEARLY,
                maxUsers: plan.maxUsers,
                features,
            },
        });
        if (plan.name === 'Free' && existing.maxUsers !== plan.maxUsers) {
            await prismaClient.subscription.updateMany({
                where: { planId: existing.id },
                data: { maxUsers: plan.maxUsers },
            });
        }
    }
}
