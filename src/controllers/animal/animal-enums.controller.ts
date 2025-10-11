import { Request, Response } from 'express';
import { Sex, AnimalStatus, ActivityLevel, RecordType, Role, AccessStatus } from '@prisma/client';

export const getAnimalEnums = async (req: Request, res: Response) => {
    try {
        const enums = {
            activityLevel: Object.values(ActivityLevel),
            AccessStatus: Object.values(AccessStatus),
            recordType: Object.values(RecordType),
            status: Object.values(AnimalStatus),
            role: Object.values(Role),
            sex: Object.values(Sex),
        };

        res.status(200).json({
            success: true,
            data: enums
        });
    } catch (error) {
        console.error('Error fetching animal enums:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch animal enums',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}; 