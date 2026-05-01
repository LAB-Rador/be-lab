import { prismaClient } from '../../lib/prisma.js';
import { AccessStatus } from '@prisma/client';
import { Request, Response } from 'express';

const accessWhere = (userId: string, labId: string, experimentId: string) => ({
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
});

export const archiveExperiment = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const updated = await prismaClient.experiment.updateMany({
            where: {
                ...accessWhere(userId, labId, experimentId),
                archivedAt: null,
            },
            data: { archivedAt: new Date() },
        });
        if (updated.count === 0) {
            const row = await prismaClient.experiment.findFirst({
                where: accessWhere(userId, labId, experimentId),
                select: { archivedAt: true },
            });
            if (!row) {
                return res.status(404).json({ success: false, message: 'Experiment not found' });
            }
            if (row.archivedAt) {
                return res.status(200).json({ success: true, message: 'Already archived' });
            }
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }
        res.status(200).json({ success: true, message: 'Experiment archived' });
    } catch (e) {
        console.error('archiveExperiment', e);
        res.status(500).json({ success: false, message: 'Failed to archive experiment' });
    }
};

export const unarchiveExperiment = async (req: Request, res: Response) => {
    try {
        const { userId, labId, experimentId } = req.params;
        const updated = await prismaClient.experiment.updateMany({
            where: {
                ...accessWhere(userId, labId, experimentId),
                archivedAt: { not: null },
            },
            data: { archivedAt: null },
        });
        if (updated.count === 0) {
            return res.status(404).json({ success: false, message: 'Experiment not found or not archived' });
        }
        res.status(200).json({ success: true, message: 'Experiment unarchived' });
    } catch (e) {
        console.error('unarchiveExperiment', e);
        res.status(500).json({ success: false, message: 'Failed to unarchive experiment' });
    }
};
