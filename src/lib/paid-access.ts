import { SubscriptionStatus } from '@prisma/client';
import { prismaClient } from './prisma.js';

export const PAID_FEATURE_MESSAGE = 'This feature is not included in the current plan.';

const PAID_PLAN_NAMES = new Set(['Starter', 'Lab', 'Group', 'Team']);

type PlanSubscription = {
    status: SubscriptionStatus;
    plan: { name: string };
} | null;

export function subscriptionAllowsPaidFeatures(subscription: PlanSubscription) {
    if (!subscription) return false;
    return subscription.status === SubscriptionStatus.ACTIVE
        && PAID_PLAN_NAMES.has(subscription.plan.name);
}

export async function laboratoryAllowsPaidFeatures(laboratoryId: string) {
    const subscription = await prismaClient.subscription.findFirst({
        where: { laboratoryId },
        orderBy: { createdAt: 'desc' },
        select: { status: true, plan: { select: { name: true } } },
    });
    return subscriptionAllowsPaidFeatures(subscription);
}
