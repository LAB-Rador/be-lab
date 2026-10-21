import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { pedigreeAnimalSelect, toPedigreeAnimal, uniquePedigree } from '../../lib/pedigree-animal.js';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const pairInclude = {
    mother: { select: pedigreeAnimalSelect },
    father: { select: pedigreeAnimalSelect },
    offspring: { select: pedigreeAnimalSelect },
} as const;

export const getAnimalGenealogy = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const animal = await prismaClient.animal.findFirst({
            where: { id: animalId, laboratoryId: lab.laboratoryId },
            select: {
                ...pedigreeAnimalSelect,
                parents: { include: pairInclude },
                motherBreedings: { include: pairInclude },
                fatherBreedings: { include: pairInclude },
            },
        });

        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        const asParent = [...animal.motherBreedings, ...animal.fatherBreedings];

        return res.status(200).json({
            success: true,
            data: {
                animal: toPedigreeAnimal(animal),
                parents: uniquePedigree(animal.parents.flatMap((pair) => [pair.mother, pair.father])),
                offspring: uniquePedigree(asParent.flatMap((pair) => pair.offspring)),
            },
        });
    } catch (error) {
        console.error('Error fetching genealogy:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch genealogy',
        });
    }
};
