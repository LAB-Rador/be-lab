import type { Request, Response } from 'express';
import { AccessStatus } from '@prisma/client';
import prismaClient from '../../lib/prisma.js';

export const getAllLaboratories = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const userLaboratories = await prismaClient.userLaboratory.findMany({
            where: {
                userId,
                accessStatus: AccessStatus.ACTIVE,
            },
            include: {
                laboratory: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        const laboratories = userLaboratories.map((userLab) => ({
            ...userLab.laboratory,
            userRole: userLab.role,
            joinedAt: userLab.joinedAt,
            accessStatus: userLab.accessStatus,
            accessStartDate: userLab.accessStartDate,
            accessEndDate: userLab.accessEndDate,
        }));

        res.status(200).json({
            success: true,
            data: laboratories,
        });
    } catch (error) {
        console.error('Failed to fetch laboratories:', error);
        res.status(500).json({ error: 'Inner server error' });
    }
};
