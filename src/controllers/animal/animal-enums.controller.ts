import { Request, Response } from 'express';
import { Sex, AnimalStatus } from '@prisma/client';

export const getAnimalEnums = async (req: Request, res: Response) => {
    try {
        const enums = {
            sex: Object.values(Sex),
            status: Object.values(AnimalStatus)
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