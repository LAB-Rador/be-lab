import { SubscriptionStatus } from '@prisma/client';
import { ensurePriceCard } from '../src/lib/price-card.js';
import { prismaClient } from '../src/lib/prisma.js';

const slug = process.argv[2];
const planName = process.argv[3];
const url = process.env.DATABASE_URL ?? '';

if (!slug || !planName) {
    console.error('Usage: e2e-set-plan.ts <slug> <plan name>');
    process.exit(1);
}

if (!url.includes(':54329/labassist_test')) {
    console.error('Refusing to change a database that is not the local test Postgres');
    process.exit(1);
}

await ensurePriceCard();
const plan = await prismaClient.plan.findFirst({
    where: { name: planName, isActive: true },
    orderBy: { createdAt: 'asc' },
});
const laboratory = await prismaClient.laboratory.findUnique({ where: { slug } });
const subscription = laboratory
    ? await prismaClient.subscription.findFirst({
        where: { laboratoryId: laboratory.id },
        orderBy: { createdAt: 'desc' },
    })
    : null;

if (!plan || !subscription) {
    console.error('Plan or subscription is missing');
    process.exit(1);
}

await prismaClient.subscription.update({
    where: { id: subscription.id },
    data: {
        planId: plan.id,
        maxUsers: plan.maxUsers,
        status: SubscriptionStatus.ACTIVE,
    },
});
await prismaClient.$disconnect();
