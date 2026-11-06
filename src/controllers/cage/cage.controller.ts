import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

const cageSelect = {
    id: true,
    name: true,
    notes: true,
    animals: {
        orderBy: { identifier: 'asc' as const },
        select: {
            id: true,
            identifier: true,
            name: true,
        },
    },
};

async function laboratoryOrDeny(userId: string, labName: string, res: Response) {
    const laboratory = await loadLaboratoryIdForActiveUser(userId, labName);
    if (!laboratory) {
        res.status(403).json({
            success: false,
            message: 'Access denied to this laboratory',
        });
        return null;
    }
    return laboratory;
}

export const listCages = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const laboratory = await laboratoryOrDeny(userId, labId, res);
        if (!laboratory) return;

        const cages = await prismaClient.cage.findMany({
            where: { laboratoryId: laboratory.laboratoryId },
            orderBy: { name: 'asc' },
            select: cageSelect,
        });
        const animals = await prismaClient.animal.findMany({
            where: {
                laboratoryId: laboratory.laboratoryId,
                archivedAt: null,
            },
            orderBy: { identifier: 'asc' },
            select: {
                id: true,
                identifier: true,
                name: true,
                cageId: true,
            },
        });

        res.status(200).json({
            success: true,
            data: { cages, animals },
        });
    } catch (error) {
        console.error('Error fetching cages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load cages',
        });
    }
};

export const createCage = async (req: Request, res: Response) => {
    try {
        const { userId, labId } = req.params;
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Cage name is required',
            });
        }

        const laboratory = await laboratoryOrDeny(userId, labId, res);
        if (!laboratory) return;

        const existing = await prismaClient.cage.findFirst({
            where: {
                laboratoryId: laboratory.laboratoryId,
                name,
            },
            select: { id: true },
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'A cage with this name already exists',
            });
        }

        const cage = await prismaClient.cage.create({
            data: {
                name,
                notes: notes || null,
                laboratoryId: laboratory.laboratoryId,
            },
            select: cageSelect,
        });

        res.status(201).json({
            success: true,
            data: cage,
        });
    } catch (error) {
        console.error('Error creating cage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create cage',
        });
    }
};

export const assignAnimalToCage = async (req: Request, res: Response) => {
    try {
        const { userId, labId, cageId } = req.params;
        const animalId = typeof req.body?.animalId === 'string' ? req.body.animalId : '';
        if (!animalId) {
            return res.status(400).json({
                success: false,
                message: 'Animal is required',
            });
        }

        const laboratory = await laboratoryOrDeny(userId, labId, res);
        if (!laboratory) return;

        const cage = await prismaClient.cage.findFirst({
            where: {
                id: cageId,
                laboratoryId: laboratory.laboratoryId,
            },
            select: { id: true },
        });
        if (!cage) {
            return res.status(404).json({
                success: false,
                message: 'Cage not found',
            });
        }

        const animal = await prismaClient.animal.findFirst({
            where: {
                id: animalId,
                laboratoryId: laboratory.laboratoryId,
                archivedAt: null,
            },
            select: { id: true },
        });
        if (!animal) {
            return res.status(404).json({
                success: false,
                message: 'Animal not found',
            });
        }

        await prismaClient.animal.update({
            where: { id: animal.id },
            data: { cageId: cage.id },
        });

        const updated = await prismaClient.cage.findUnique({
            where: { id: cage.id },
            select: cageSelect,
        });

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error('Error assigning animal to cage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add animal to cage',
        });
    }
};

export const getCage = async (req: Request, res: Response) => {
    try {
        const { userId, labId, cageId } = req.params;
        const laboratory = await laboratoryOrDeny(userId, labId, res);
        if (!laboratory) return;

        const cage = await prismaClient.cage.findFirst({
            where: {
                id: cageId,
                laboratoryId: laboratory.laboratoryId,
            },
            select: cageSelect,
        });
        if (!cage) {
            return res.status(404).json({
                success: false,
                message: 'Cage not found',
            });
        }

        res.status(200).json({
            success: true,
            data: cage,
        });
    } catch (error) {
        console.error('Error fetching cage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load cage',
        });
    }
};

export const removeAnimalFromCage = async (req: Request, res: Response) => {
    try {
        const { userId, labId, cageId, animalId } = req.params;
        const laboratory = await laboratoryOrDeny(userId, labId, res);
        if (!laboratory) return;

        const cage = await prismaClient.cage.findFirst({
            where: {
                id: cageId,
                laboratoryId: laboratory.laboratoryId,
            },
            select: { id: true },
        });
        if (!cage) {
            return res.status(404).json({
                success: false,
                message: 'Cage not found',
            });
        }

        const removed = await prismaClient.animal.updateMany({
            where: {
                id: animalId,
                cageId: cage.id,
                laboratoryId: laboratory.laboratoryId,
            },
            data: { cageId: null },
        });
        if (removed.count === 0) {
            return res.status(404).json({
                success: false,
                message: 'Animal is not in this cage',
            });
        }

        const updated = await prismaClient.cage.findUnique({
            where: { id: cage.id },
            select: cageSelect,
        });

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error('Error removing animal from cage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove animal from cage',
        });
    }
};
