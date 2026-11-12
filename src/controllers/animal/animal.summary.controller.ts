import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const dayMs = 24 * 60 * 60 * 1000;

function utcDay(value: Date) {
    return value.toISOString().slice(0, 10);
}

export const getAnimalSummary = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const now = new Date();
        const populationSince = new Date(now.getTime() - 30 * dayMs);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const where = { laboratoryId: lab.laboratoryId, archivedAt: null };

        const total = await prismaClient.animal.count({ where });
        const acquiredPreviousMonth = await prismaClient.animal.count({
            where: {
                ...where,
                acquisitionDate: { gte: previousMonthStart, lte: previousMonthEnd },
            },
        });
        const statusRows = await prismaClient.animal.groupBy({
            by: ['status'],
            where,
            _count: { _all: true },
        });
        const populationRows = await prismaClient.animal.groupBy({
            by: ['acquisitionDate', 'animalTypeId'],
            where: { ...where, acquisitionDate: { gte: populationSince } },
            _count: { _all: true },
        });

        const typeIds = [...new Set(populationRows.map((row) => row.animalTypeId))];
        const types = typeIds.length === 0
            ? []
            : await prismaClient.animalType.findMany({
                where: { id: { in: typeIds } },
                select: { id: true, name: true },
            });
        const typeNames = new Map(types.map((type) => [type.id, type.name]));
        const folded = new Map<string, number>();
        for (const row of populationRows) {
            const date = utcDay(row.acquisitionDate);
            const animalType = typeNames.get(row.animalTypeId) ?? 'Unknown';
            const key = `${date}\u0000${animalType}`;
            folded.set(key, (folded.get(key) ?? 0) + row._count._all);
        }

        return res.status(200).json({
            success: true,
            data: {
                total,
                acquiredPreviousMonth,
                byStatus: statusRows.map((row) => ({ status: row.status, count: row._count._all })),
                population: [...folded.entries()].map(([key, count]) => {
                    const [date, animalType] = key.split('\u0000');
                    return { date, animalType, count };
                }),
            },
        });
    } catch (error) {
        console.error('Error summarizing animals:', error);
        return res.status(500).json({ success: false, message: 'Failed to summarize animals' });
    }
};
