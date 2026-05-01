import { AccessStatus, ActivityLevel } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

function activityToScore(level: ActivityLevel | null): number | null {
    if (!level) return null;
    const map: Record<ActivityLevel, number> = {
        [ActivityLevel.VERY_LOW]: 1,
        [ActivityLevel.LOW]: 2,
        [ActivityLevel.NORMAL]: 3,
        [ActivityLevel.HIGH]: 4,
        [ActivityLevel.VERY_HIGH]: 5,
    };
    return map[level] ?? null;
}

function mean(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

export const getExperimentMetrics = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;

        const experiment = await prismaClient.experiment.findFirst({
            where: {
                id: experimentId,
                laboratory: {
                    name: labId,
                    users: {
                        some: {
                            userId: userId,
                            accessStatus: AccessStatus.ACTIVE,
                        },
                    },
                },
                OR: [{ createdById: userId }, { members: { some: { userId } } }],
            },
            select: {
                id: true,
                animals: { select: { animalId: true } },
            },
        });

        if (!experiment) {
            return res.status(404).json({
                success: false,
                message: 'Experiment not found',
            });
        }

        const animalIds = experiment.animals.map((row) => row.animalId);
        const animalCount = animalIds.length;

        if (animalCount === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    series: [] as Array<{
                        day: string;
                        temperature: number | null;
                        activity: number | null;
                        weight: number | null;
                    }>,
                    averages: {
                        temperature: null as number | null,
                        activity: null as number | null,
                        weight: null as number | null,
                    },
                    recordCount: 0,
                    animalCount: 0,
                },
            });
        }

        const records = await prismaClient.animalRecord.findMany({
            where: { animalId: { in: animalIds } },
            select: {
                date: true,
                temperature: true,
                activityLevel: true,
                weight: true,
            },
            orderBy: { date: 'asc' },
        });

        type Bucket = {
            temperatures: number[];
            activities: number[];
            weights: number[];
        };
        const byDay = new Map<string, Bucket>();

        const allTemp: number[] = [];
        const allAct: number[] = [];
        const allWeight: number[] = [];

        for (const r of records) {
            const day = r.date.toISOString().slice(0, 10);
            let bucket = byDay.get(day);
            if (!bucket) {
                bucket = { temperatures: [], activities: [], weights: [] };
                byDay.set(day, bucket);
            }
            if (r.temperature != null) {
                bucket.temperatures.push(r.temperature);
                allTemp.push(r.temperature);
            }
            const actScore = activityToScore(r.activityLevel);
            if (actScore != null) {
                bucket.activities.push(actScore);
                allAct.push(actScore);
            }
            if (r.weight != null) {
                bucket.weights.push(r.weight);
                allWeight.push(r.weight);
            }
        }

        const sortedDays = [...byDay.keys()].sort();
        const series = sortedDays
            .map((day) => {
                const b = byDay.get(day)!;
                return {
                    day,
                    temperature: mean(b.temperatures),
                    activity: mean(b.activities),
                    weight: mean(b.weights),
                };
            })
            .filter(
                (row) =>
                    row.temperature != null || row.activity != null || row.weight != null,
            );

        res.status(200).json({
            success: true,
            data: {
                series,
                averages: {
                    temperature: mean(allTemp),
                    activity: mean(allAct),
                    weight: mean(allWeight),
                },
                recordCount: records.length,
                animalCount,
            },
        });
    } catch (error) {
        console.error('Error fetching experiment metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch experiment metrics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
