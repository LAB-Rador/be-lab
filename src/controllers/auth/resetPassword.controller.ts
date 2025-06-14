import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import sendResetResetConfirmationCode from '../../services/email/reset.service.js';
import generateCode from '../../lib/codeGenerator.js';
import prismaClient from '../../lib/prisma.js';

const userClient = prismaClient;

export const createResetCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await userClient.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'No user find with existing email!',
            });
        }

        // Generate Verification Code
        const code = await generateCode();
        await prismaClient.verificationCode.create({
            data: {
                email,
                code,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        await sendResetResetConfirmationCode(email, code);

        res.status(201).json({
            success: true,
            message: 'Reset confirmation code was created!',
        });
    } catch (error) {
        console.error('Error to create confirmation code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create confirmation code',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { code, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

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
                password: hashedPassword,
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
            message: 'New password successfully reseted.',
        });
    } catch (error) {
        console.error('Error Reset Password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to Reset Password',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
