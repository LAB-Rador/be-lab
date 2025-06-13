import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prismaClient from '../../lib/prisma';

export const createLaboratory = async (req: Request, res: Response) => {
    const { userId, name, ...labData } = req.body;

    try {
        const existingLab = await prismaClient.laboratory.findFirst({
            where: {
                name,
                users: {
                    some: {
                        userId,
                    },
                },
            },
        });

        if (existingLab) {
            return res.status(200).json({
                success: false,
                message: 'You already have a laboratory with this name!',
            });
        }
    } catch (error) {
        console.error('Error checking existing laboratory:', error);
        return res.status(200).json({
            success: false,
            message: 'You already have a laboratory with this name!',
        });
    }

    try {
        const laboratory = await prismaClient.laboratory.create({
            data: { name, ...labData },
        });

        const userLab = await prismaClient.userLaboratory.create({
            data: {
                userId,
                laboratoryId: laboratory.id,
                role: Role.OWNER,
            },
        });

        res.status(201).json({
            success: true,
            data: laboratory,
            message: 'Laboratory created successfully!',
        });
    } catch (error) {
        console.error('Error create laboratory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create laboratory',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
