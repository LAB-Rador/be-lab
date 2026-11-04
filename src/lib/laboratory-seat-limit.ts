import { AccessStatus, InvitationStatus } from '@prisma/client';
import { prismaClient } from './prisma.js';

export function planUserLimitMessage(maxUsers: number) {
    return maxUsers === 1
        ? 'This plan allows 1 user.'
        : `This plan allows ${maxUsers} users.`;
}

export async function inviteExceedsPlan(laboratoryId: string, email: string) {
    const subscription = await prismaClient.subscription.findFirst({
        where: { laboratoryId },
        orderBy: { createdAt: 'desc' },
        select: { maxUsers: true },
    });
    if (!subscription) return null;

    const alreadyMember = await prismaClient.userLaboratory.findFirst({
        where: {
            laboratoryId,
            accessStatus: AccessStatus.ACTIVE,
            user: { email },
        },
        select: { id: true },
    });
    if (alreadyMember) return null;

    const activeMembers = await prismaClient.userLaboratory.count({
        where: { laboratoryId, accessStatus: AccessStatus.ACTIVE },
    });
    const otherPending = await prismaClient.invitation.count({
        where: {
            laboratoryId,
            status: InvitationStatus.PENDING,
            email: { not: email },
        },
    });

    if (activeMembers + otherPending >= subscription.maxUsers) {
        return { maxUsers: subscription.maxUsers };
    }
    return null;
}
