import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

async function labIdForUser(userId: string, labName: string) {
    const ul = await prismaClient.userLaboratory.findFirst({
        where: {
            userId,
            accessStatus: AccessStatus.ACTIVE,
            laboratory: { name: labName },
        },
        select: { laboratory: { select: { id: true } } },
    });
    return ul?.laboratory.id ?? null;
}

export const archiveAnimal = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalId } = req.params;
        const laboratoryId = await labIdForUser(userId, labId);
        if (!laboratoryId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const updated = await prismaClient.animal.updateMany({
            where: {
                id: animalId,
                laboratoryId,
                archivedAt: null,
            },
            data: { archivedAt: new Date() },
        });
        if (updated.count === 0) {
            const row = await prismaClient.animal.findFirst({
                where: { id: animalId, laboratoryId },
                select: { archivedAt: true },
            });
            if (!row) {
                return res.status(404).json({ success: false, message: 'Animal not found' });
            }
            if (row.archivedAt) {
                return res.status(200).json({ success: true, message: 'Already archived' });
            }
        }
        res.status(200).json({ success: true, message: 'Animal archived' });
    } catch (e) {
        console.error('archiveAnimal', e);
        res.status(500).json({ success: false, message: 'Failed to archive animal' });
    }
};

export const unarchiveAnimal = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalId } = req.params;
        const laboratoryId = await labIdForUser(userId, labId);
        if (!laboratoryId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const updated = await prismaClient.animal.updateMany({
            where: {
                id: animalId,
                laboratoryId,
                archivedAt: { not: null },
            },
            data: { archivedAt: null },
        });
        if (updated.count === 0) {
            return res.status(404).json({ success: false, message: 'Animal not found or not archived' });
        }
        res.status(200).json({ success: true, message: 'Animal unarchived' });
    } catch (e) {
        console.error('unarchiveAnimal', e);
        res.status(500).json({ success: false, message: 'Failed to unarchive animal' });
    }
};
