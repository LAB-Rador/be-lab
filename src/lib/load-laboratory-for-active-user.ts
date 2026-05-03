import { AccessStatus } from '@prisma/client';
import { prismaClient } from './prisma.js';

export async function loadLaboratoryIdForActiveUser(
    userId: string,
    labName: string,
): Promise<{ laboratoryId: string; laboratoryName: string } | null> {
    const row = await prismaClient.userLaboratory.findFirst({
        where: {
            userId,
            accessStatus: AccessStatus.ACTIVE,
            laboratory: { name: labName },
        },
        select: {
            laboratoryId: true,
            laboratory: { select: { name: true } },
        },
    });
    if (!row) return null;
    return { laboratoryId: row.laboratoryId, laboratoryName: row.laboratory.name };
}
