import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import sendVarificationCode from '../../services/email/verification.service';
import generateCode from '../../lib/codeGenerator';
import prismaClient from '../../lib/prisma';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { password, ...userData } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prismaClient.user.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
        });
        const {
            confirmedEmail,
            contactPhone,
            institution,
            createdAt,
            firstName,
            lastName,
            address,
            email,
            id,
        } = user;
        const successUser = {
            confirmedEmail,
            contactPhone,
            institution,
            createdAt,
            firstName,
            lastName,
            address,
            email,
            id,
        };

        // Generate Verification Code
        const code = await generateCode();
        await prismaClient.verificationCode.create({
            data: {
                email: user.email,
                code,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        await sendVarificationCode(user.email, code);

        res.status(201).json({ success: true, data: successUser });
    } catch (error) {
        console.error('Error create user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
