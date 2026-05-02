import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import sendVarificationCode from '../../services/email/verification.service.js';
import generateCode from '../../lib/codeGenerator.js';
import { prismaClient } from '../../lib/prisma.js';

const allowedCreateFields = [
    'email',
    'firstName',
    'lastName',
    'address',
    'contactPhone',
    'institution',
] as const;

function pickCreateUserBody(body: Record<string, unknown>) {
    const out: Record<string, string | null | undefined> = {};
    for (const key of allowedCreateFields) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            const v = body[key];
            if (v === null || v === undefined) {
                out[key] = v === null ? null : undefined;
            } else if (typeof v === 'string') {
                out[key] = v;
            }
        }
    }
    return out;
}

export const createUser = async (req: Request, res: Response) => {
    try {
        const body = req.body as Record<string, unknown>;
        const password = body?.password;
        if (typeof password !== 'string' || password.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'password is required',
            });
        }
        const userData = pickCreateUserBody(body);
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
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
