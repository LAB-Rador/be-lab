import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

function readName(value: unknown) {
    if (typeof value !== 'string') return '';
    return value.trim();
}

function readOptionalText(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
}

const typeSelect = {
    id: true,
    name: true,
    description: true,
    _count: { select: { animals: true } },
} as const;

function toAnimalType(row: { id: string; name: string; description: string | null; _count: { animals: number } }) {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        animalCount: row._count.animals,
    };
}

export const updateAnimalType = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalTypeId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const name = readName(req.body?.name);
        if (!name || name.length > 80) {
            return res.status(400).json({ success: false, message: 'Enter a name.' });
        }

        const existing = await prismaClient.animalType.findFirst({
            where: { id: animalTypeId, laboratoryId: lab.laboratoryId },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Animal type not found' });
        }

        const updated = await prismaClient.animalType.update({
            where: { id: animalTypeId },
            data: {
                name,
                description: readOptionalText(req.body?.description),
            },
            select: typeSelect,
        });
        return res.status(200).json({ success: true, data: toAnimalType(updated) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'An animal type with this name already exists.' });
        }
        console.error('Error updating animal type:', error);
        return res.status(500).json({ success: false, message: 'Failed to update animal type' });
    }
};

export const deleteAnimalType = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalTypeId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.animalType.findFirst({
            where: { id: animalTypeId, laboratoryId: lab.laboratoryId },
            select: typeSelect,
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Animal type not found' });
        }
        if (existing._count.animals > 0) {
            return res.status(409).json({ success: false, message: 'This animal type is used by animals.' });
        }

        await prismaClient.animalType.delete({ where: { id: animalTypeId } });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting animal type:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete animal type' });
    }
};
