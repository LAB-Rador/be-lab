import type { Request, Response } from 'express';
import prismaClient from '../../lib/prisma.js';

const userClient = prismaClient;

export const confirmEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { code } = req.body;
        const record = await userClient.verificationCode.findFirst({
            where: {
                email,
                code,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code',
            });
        }

        const updatedUser = await userClient.user.update({
            where: {
                email,
            },
            data: {
                confirmedEmail: true,
            },
        });

        await userClient.verificationCode.delete({
            where: {
                id: record.id,
            },
        });

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'Verification code successfully confirmed.',
        });
    } catch (error) {
        console.error('Error Verififying Email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
