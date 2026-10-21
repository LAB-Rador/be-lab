import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { pedigreeAnimalSelect, toPedigreeAnimal } from '../../lib/pedigree-animal.js';
import { BreedingStatus } from '@prisma/client';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const breedingStatuses = new Set<string>(Object.values(BreedingStatus));

function readIdList(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export const createBreeding = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const laboratoryId = lab.laboratoryId;

        const motherId = typeof req.body.motherId === 'string' ? req.body.motherId : '';
        const fatherId = typeof req.body.fatherId === 'string' ? req.body.fatherId : '';
        const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
        const status = typeof req.body.status === 'string' && req.body.status ? req.body.status : BreedingStatus.ACTIVE;
        const offspringIds = readIdList(req.body.offspringIds).filter((id) => id !== motherId && id !== fatherId);
        const startDate = new Date(req.body.startDate);

        if (!motherId || !fatherId || Number.isNaN(startDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Mother, father, and a valid start date are required',
            });
        }
        if (motherId === fatherId) {
            return res.status(400).json({ success: false, message: 'Mother and father must be different animals' });
        }
        if (!breedingStatuses.has(status)) {
            return res.status(400).json({ success: false, message: 'Unknown breeding status' });
        }

        const animalIds = [...new Set([motherId, fatherId, ...offspringIds])];
        const animals = await prismaClient.animal.findMany({
            where: { id: { in: animalIds }, laboratoryId },
            select: { id: true },
        });
        if (animals.length !== animalIds.length) {
            return res.status(400).json({ success: false, message: 'Every animal must belong to this laboratory' });
        }

        const breeding = await prismaClient.breeding.create({
            data: {
                motherId,
                fatherId,
                startDate,
                status: status as BreedingStatus,
                notes: notes || null,
                offspring: offspringIds.length > 0 ? { connect: offspringIds.map((id) => ({ id })) } : undefined,
            },
            include: {
                protocol: { select: { id: true, name: true } },
                mother: { select: pedigreeAnimalSelect },
                father: { select: pedigreeAnimalSelect },
                offspring: { select: pedigreeAnimalSelect },
            },
        });

        return res.status(201).json({
            success: true,
            data: {
                id: breeding.id,
                status: breeding.status,
                startDate: breeding.startDate,
                endDate: breeding.endDate,
                notes: breeding.notes,
                protocol: breeding.protocol,
                mother: toPedigreeAnimal(breeding.mother),
                father: toPedigreeAnimal(breeding.father),
                offspring: breeding.offspring.map(toPedigreeAnimal),
            },
        });
    } catch (error) {
        console.error('Error creating breeding:', error);
        return res.status(500).json({ success: false, message: 'Failed to create breeding' });
    }
};
