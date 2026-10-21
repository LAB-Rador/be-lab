import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { pedigreeAnimalSelect, toPedigreeAnimal } from '../../lib/pedigree-animal.js';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const listBreedings = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const laboratoryId = lab.laboratoryId;

        const breedings = await prismaClient.breeding.findMany({
            where: {
                OR: [
                    { mother: { laboratoryId } },
                    { father: { laboratoryId } },
                ],
            },
            orderBy: { startDate: 'desc' },
            include: {
                protocol: { select: { id: true, name: true } },
                mother: { select: pedigreeAnimalSelect },
                father: { select: pedigreeAnimalSelect },
                offspring: { select: pedigreeAnimalSelect },
            },
        });

        const data = breedings.map((breeding) => ({
            id: breeding.id,
            status: breeding.status,
            startDate: breeding.startDate,
            endDate: breeding.endDate,
            notes: breeding.notes,
            protocol: breeding.protocol,
            mother: toPedigreeAnimal(breeding.mother),
            father: toPedigreeAnimal(breeding.father),
            offspring: breeding.offspring.map(toPedigreeAnimal),
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching breedings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch breedings',
        });
    }
};
