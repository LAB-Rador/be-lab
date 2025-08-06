import { Request, Response } from 'express';
import { Sex, AnimalStatus, ActivityLevel, RecordType } from '@prisma/client';

export const getAnimalEnums = async (req: Request, res: Response) => {
    try {
        const enums = {
            activityLevel: Object.values(ActivityLevel),
            recordType: Object.values(RecordType),
            status: Object.values(AnimalStatus),
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