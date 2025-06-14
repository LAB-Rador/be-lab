import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prismaClient from '../../lib/prisma.js';

const authClient = prismaClient;

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await authClient.user.findUnique({
            where: { email },
        });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({
                success: false,
                error: 'Please check your login details and try again',
            });
        }

        const secret = process.env.PRIVATE_KEY;
        if (!secret || typeof secret !== 'string' || secret.trim() === '') {
            throw new Error('PRIVATE_KEY is not configured or invalid');
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                confirmedEmail: user.confirmedEmail,
                createdAt: user.createdAt,
                firstName: user.firstName,
                lastName: user.lastName,
                institution: user.institution,
                contactPhone: user.contactPhone,
                address: user.address,
            },
            secret,
            { algorithm: 'RS256', expiresIn: '1d' },
        );
        // .replace(/\\n/g, '\n')
        const refreshToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                confirmedEmail: user.confirmedEmail,
                createdAt: user.createdAt,
                firstName: user.firstName,
                lastName: user.lastName,
                institution: user.institution,
                contactPhone: user.contactPhone,
                address: user.address,
            },
            secret,
            { algorithm: 'RS256', expiresIn: '7d' },
        );

        const laboratory = await authClient.userLaboratory.findFirst({
            where: {
                userId: user.id,
            },
        });

        res.status(200)
            .json({
                message: 'You have successfully logged in.',
                success: true,
                laboratory,
                refreshToken,
                accessToken,
                user: {
                    firstName: user.firstName,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastName: user.lastName,
                    institution: user.institution,
                    contactPhone: user.contactPhone,
                    confirmedEmail: user.confirmedEmail,
                    address: user.address,
                    email: user.email,
                    userId: user.id,
                },
            });
    } catch (error) {
        console.error('An error occurred. Please try again later:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred. Please try again later',
        });
    }
};
