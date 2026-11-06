import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const createLitter = async (req: Request, res: Response) => {
    try {
        const { userId, labId, breedingId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const bornDate = new Date(typeof req.body?.bornDate === 'string' ? req.body.bornDate : '');
        const count = req.body?.count;
        const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
        if (Number.isNaN(bornDate.getTime()) || typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
            return res.status(400).json({
                success: false,
                message: 'A birth date and a whole pup count are required',
            });
        }

        const breeding = await prismaClient.breeding.findFirst({
            where: {
                id: breedingId,
                OR: [
                    { mother: { laboratoryId: lab.laboratoryId } },
                    { father: { laboratoryId: lab.laboratoryId } },
                ],
            },
            select: { id: true },
        });
        if (!breeding) {
            return res.status(404).json({ success: false, message: 'Breeding pair not found' });
        }

        const litter = await prismaClient.litter.create({
            data: {
                breedingId: breeding.id,
                bornDate,
                count,
                notes: notes || null,
            },
            select: {
                id: true,
                bornDate: true,
                count: true,
                notes: true,
            },
        });

        return res.status(201).json({ success: true, data: litter });
    } catch (error) {
        console.error('Error creating litter:', error);
        return res.status(500).json({ success: false, message: 'Failed to record litter' });
    }
};
