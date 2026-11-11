import { prismaClient } from '../../lib/prisma.js';
import { useCaller } from '../../middleware/require-user.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

const animalRecordClient = prismaClient;


export const addAnimalRecord = async (req: Request, res: Response) => {
    try {
        const {
            activityLevel,
            animalId,
            createdById,
            date,
            experimentId,
            feedIntake,
            measurements,
            notes,
            recordType,
            temperature,
            waterIntake,
            weight,
        } = req.body;

        const userId = useCaller(req, res, createdById);
        if (!userId) return;
        if (typeof animalId !== 'string' || animalId.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Animal is required',
            });
        }

        const animal = await animalRecordClient.animal.findUnique({
            where: { id: animalId },
            select: { laboratoryId: true },
        });
        if (!animal) {
            return res.status(404).json({
                success: false,
                message: 'Animal not found',
            });
        }
        const membership = await animalRecordClient.userLaboratory.findFirst({
            where: {
                userId,
                laboratoryId: animal.laboratoryId,
                accessStatus: AccessStatus.ACTIVE,
            },
            select: { id: true },
        });
        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this laboratory',
            });
        }

        let resolvedExperimentId: string | undefined;
        if (experimentId != null && experimentId !== '') {
            const link = await animalRecordClient.experimentAnimal.findUnique({
                where: {
                    experimentId_animalId: {
                        experimentId: String(experimentId),
                        animalId: String(animalId),
                    },
                },
            });
            if (!link) {
                return res.status(400).json({
                    success: false,
                    message: 'Animal is not linked to this experiment',
                });
            }
            resolvedExperimentId = String(experimentId);
        }

        const animalRecord = await animalRecordClient.animalRecord.create({
            data: {
                activityLevel,
                animalId,
                createdById: userId,
                ...(resolvedExperimentId ? { experimentId: resolvedExperimentId } : {}),
                ...(date ? { date: new Date(date) } : {}),
                feedIntake,
                notes,
                recordType,
                temperature,
                waterIntake,
                weight,
                ...(Array.isArray(measurements) && measurements.length
                    ? {
                        measurements: {
                            create: measurements.map((m: any) => ({
                                parameter: m.parameterName,
                                value: m.parameterValue,
                                unit: m.parameterUnit ?? null,
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                measurements: true,
            },
        });

        res.status(201).json({ success: true, message: 'Animal record created successfully', data: animalRecord });
    } catch (error) {
        console.error('Error adding animal record:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add animal record',
        });
    }
}