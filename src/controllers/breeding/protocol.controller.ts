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

const protocolSelect = {
    id: true,
    name: true,
    description: true,
    instructions: true,
    animalTypeId: true,
    animalType: { select: { name: true } },
    _count: { select: { breedings: true } },
} as const;

type ProtocolRow = {
    id: string;
    name: string;
    description: string | null;
    instructions: string | null;
    animalTypeId: string;
    animalType: { name: string };
    _count: { breedings: number };
};

function toProtocol(row: ProtocolRow) {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        instructions: row.instructions ?? '',
        animalTypeId: row.animalTypeId,
        animalTypeName: row.animalType.name,
        pairCount: row._count.breedings,
    };
}

async function readProtocolBody(laboratoryId: string, body: { name?: unknown; description?: unknown; instructions?: unknown; animalTypeId?: unknown }) {
    const name = readName(body?.name);
    const animalTypeId = typeof body?.animalTypeId === 'string' ? body.animalTypeId : '';
    if (!name || name.length > 80 || !animalTypeId) return null;
    const animalType = await prismaClient.animalType.findFirst({
        where: { id: animalTypeId, laboratoryId },
        select: { id: true },
    });
    if (!animalType) return null;
    return {
        name,
        animalTypeId,
        description: readOptionalText(body?.description),
        instructions: readOptionalText(body?.instructions),
    };
}

export const listBreedingProtocols = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const protocols = await prismaClient.breedingProtocol.findMany({
            where: { animalType: { laboratoryId: lab.laboratoryId } },
            orderBy: { name: 'asc' },
            select: protocolSelect,
        });
        return res.status(200).json({ success: true, data: protocols.map(toProtocol) });
    } catch (error) {
        console.error('Error listing breeding protocols:', error);
        return res.status(500).json({ success: false, message: 'Failed to list breeding protocols' });
    }
};

export const createBreedingProtocol = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const parsed = await readProtocolBody(lab.laboratoryId, req.body ?? {});
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Enter a name and an animal type.' });
        }

        const protocol = await prismaClient.breedingProtocol.create({
            data: parsed,
            select: protocolSelect,
        });
        return res.status(201).json({ success: true, data: toProtocol(protocol) });
    } catch (error) {
        console.error('Error creating breeding protocol:', error);
        return res.status(500).json({ success: false, message: 'Failed to create breeding protocol' });
    }
};

export const updateBreedingProtocol = async (req: Request, res: Response) => {
    try {
        const { userId, labId, protocolId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }
        const parsed = await readProtocolBody(lab.laboratoryId, req.body ?? {});
        if (!parsed) {
            return res.status(400).json({ success: false, message: 'Enter a name and an animal type.' });
        }

        const existing = await prismaClient.breedingProtocol.findFirst({
            where: { id: protocolId, animalType: { laboratoryId: lab.laboratoryId } },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Breeding protocol not found' });
        }

        const protocol = await prismaClient.breedingProtocol.update({
            where: { id: protocolId },
            data: parsed,
            select: protocolSelect,
        });
        return res.status(200).json({ success: true, data: toProtocol(protocol) });
    } catch (error) {
        console.error('Error updating breeding protocol:', error);
        return res.status(500).json({ success: false, message: 'Failed to update breeding protocol' });
    }
};

export const deleteBreedingProtocol = async (req: Request, res: Response) => {
    try {
        const { userId, labId, protocolId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const existing = await prismaClient.breedingProtocol.findFirst({
            where: { id: protocolId, animalType: { laboratoryId: lab.laboratoryId } },
            select: { id: true, _count: { select: { breedings: true } } },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Breeding protocol not found' });
        }
        if (existing._count.breedings > 0) {
            return res.status(409).json({ success: false, message: 'This protocol is used by breeding pairs.' });
        }

        await prismaClient.breedingProtocol.delete({ where: { id: protocolId } });
        return res.status(200).json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return res.status(409).json({ success: false, message: 'This protocol is used by breeding pairs.' });
        }
        console.error('Error deleting breeding protocol:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete breeding protocol' });
    }
};
