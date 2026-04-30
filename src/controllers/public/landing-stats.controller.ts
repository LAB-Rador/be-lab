import type { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';
import { AnimalStatus } from '@prisma/client';

const OUT_OF_LAB: AnimalStatus[] = [AnimalStatus.DECEASED, AnimalStatus.TRANSFERRED];

/**
 * Sequential queries inside one transaction = one pool connection at a time.
 * Avoids P2024 when using Supabase pooler with a small connection_limit.
 */
export const getLandingStats = async (_req: Request, res: Response) => {
    try {
        const {
            totalAnimals,
            inCareCount,
            activeStrictCount,
            laboratoriesCount,
            usersCount,
            grouped,
            types,
        } = await prismaClient.$transaction(async (tx) => {
            const totalAnimals = await tx.animal.count();
            const inCareCount = await tx.animal.count({
                where: { status: { notIn: OUT_OF_LAB } },
            });
            const activeStrictCount = await tx.animal.count({
                where: { status: AnimalStatus.ACTIVE },
            });
            const laboratoriesCount = await tx.laboratory.count();
            const usersCount = await tx.user.count();
            const grouped = await tx.animal.groupBy({
                by: ['animalTypeId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 3,
            });
            const typeIds = grouped.map((g) => g.animalTypeId);
            const types =
                typeIds.length === 0
                    ? []
                    : await tx.animalType.findMany({
                          where: { id: { in: typeIds } },
                          select: { id: true, name: true },
                      });
            return {
                totalAnimals,
                inCareCount,
                activeStrictCount,
                laboratoriesCount,
                usersCount,
                grouped,
                types,
            };
        });

        const inCarePercent =
            totalAnimals === 0 ? 0 : Math.round((inCareCount / totalAnimals) * 1000) / 10;
        const activePercent =
            totalAnimals === 0 ? 0 : Math.round((activeStrictCount / totalAnimals) * 1000) / 10;

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
