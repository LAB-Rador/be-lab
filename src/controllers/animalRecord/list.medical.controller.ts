import { loadLaboratoryIdForActiveUser } from '../../lib/load-laboratory-for-active-user.js';
import { prismaClient } from '../../lib/prisma.js';
import { RecordType } from '@prisma/client';
import { Request, Response } from 'express';

const medicalRecordTypes = [
    RecordType.MEDICATION,
    RecordType.TREATMENT,
    RecordType.EMERGENCY,
    RecordType.SAMPLING,
];

export const listMedicalRecords = async (req: Request, res: Response) => {
    try {
        const { userId, labId, animalId } = req.params;
        const lab = await loadLaboratoryIdForActiveUser(userId, labId);
        if (!lab) {
            return res.status(403).json({ success: false, message: 'Access denied to this laboratory' });
        }

        const animal = await prismaClient.animal.findFirst({
            where: { id: animalId, laboratoryId: lab.laboratoryId },
            select: { id: true },
        });
        if (!animal) {
            return res.status(404).json({ success: false, message: 'Animal not found' });
        }

        const records = await prismaClient.animalRecord.findMany({
            where: {
                animalId,
                recordType: { in: medicalRecordTypes },
            },
            orderBy: { date: 'desc' },
            take: 200,
            select: {
                id: true,
                date: true,
                recordType: true,
                notes: true,
                createdBy: { select: { firstName: true, lastName: true } },
            },
        });

        return res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch medical records' });
    }
};
