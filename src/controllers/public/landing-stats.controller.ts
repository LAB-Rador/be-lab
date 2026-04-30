import type { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AnimalStatus } from '@prisma/client';

const OUT_OF_LAB: AnimalStatus[] = [AnimalStatus.DECEASED, AnimalStatus.TRANSFERRED];

export const getLandingStats = async (_req: Request, res: Response) => {
    try {
        const [totalAnimals, inCareCount, activeStrictCount, laboratoriesCount, usersCount, grouped] = await Promise.all([
            prismaClient.animal.count(),
            prismaClient.animal.count({
                where: { status: { notIn: OUT_OF_LAB } },
            }),
            prismaClient.animal.count({
                where: { status: AnimalStatus.ACTIVE },
            }),
            prismaClient.laboratory.count(),
            prismaClient.user.count(),
            prismaClient.animal.groupBy({
                by: ['animalTypeId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 3,
            }),
        ]);

        const inCarePercent =
            totalAnimals === 0 ? 0 : Math.round((inCareCount / totalAnimals) * 1000) / 10;
        const activePercent =
            totalAnimals === 0 ? 0 : Math.round((activeStrictCount / totalAnimals) * 1000) / 10;

        const typeIds = grouped.map((g) => g.animalTypeId);
        const types =
            typeIds.length === 0
                ? []
                : await prismaClient.animalType.findMany({
                      where: { id: { in: typeIds } },
                      select: { id: true, name: true },
                  });
        const idToName = Object.fromEntries(types.map((t) => [t.id, t.name]));
        const topAnimalTypes = grouped.map((g) => ({
            name: idToName[g.animalTypeId] ?? 'Unknown type',
            count: g._count.id,
        }));

        res.status(200).json({
            success: true,
            data: {
                inCarePercent,
                activePercent,
                researchLabs: laboratoriesCount,
                animalsTracked: totalAnimals,
                registeredUsers: usersCount,
                topAnimalTypes,
            },
        });
    } catch (error) {
        console.error('Error fetching landing stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch landing stats',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
