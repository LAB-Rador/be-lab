import { randomUUID } from 'node:crypto';
import {
    AccessStatus,
    BillingCycle,
    Role,
    Sex,
    SubscriptionStatus,
} from '@prisma/client';
import { prismaClient } from '../src/lib/prisma.js';

export function assertTestDatabase() {
    const url = process.env.DATABASE_URL ?? '';
    if (!url.includes('localhost:54329/labassist_test')) {
        throw new Error('Refusing to run against a database that is not the local test Postgres');
    }
}

export async function createLaboratory(plan: { name: string; maxUsers: number; price: number }) {
    assertTestDatabase();
    const stamp = randomUUID();
    const user = await prismaClient.user.create({
        data: {
            email: `owner-${stamp}@labassist.test`,
            confirmedEmail: true,
            firstName: 'Owner',
        },
    });
    const planRow = await prismaClient.plan.create({
        data: {
            name: plan.name,
            price: plan.price,
            currency: 'USD',
            billingCycle: BillingCycle.YEARLY,
            maxUsers: plan.maxUsers,
            isActive: true,
        },
    });
    const slug = `lab-${stamp.slice(0, 8)}`;
    const laboratory = await prismaClient.laboratory.create({
        data: {
            name: `Lab ${stamp.slice(0, 8)}`,
            slug,
            username: `user-${stamp.slice(0, 8)}`,
            position: 'PI',
        },
    });
    const membership = await prismaClient.userLaboratory.create({
        data: {
            userId: user.id,
            laboratoryId: laboratory.id,
            role: Role.OWNER,
            accessStatus: AccessStatus.ACTIVE,
        },
    });
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    await prismaClient.subscription.create({
        data: {
            laboratoryId: laboratory.id,
            planId: planRow.id,
            startDate: start,
            endDate: end,
            status: SubscriptionStatus.ACTIVE,
            maxUsers: plan.maxUsers,
        },
    });
    return { user, laboratory, membership, slug };
}

export async function createAnimal(
    laboratoryId: string,
    animalTypeId: string,
    identifier: string,
    sex: Sex,
) {
    return prismaClient.animal.create({
        data: { identifier, animalTypeId, laboratoryId, sex },
    });
}

export { Sex };
