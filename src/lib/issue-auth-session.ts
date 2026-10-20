import type { User, UserLaboratory } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prismaClient } from './prisma.js';

type SessionUser = Pick<
    User,
    | 'id'
    | 'email'
    | 'confirmedEmail'
    | 'createdAt'
    | 'updatedAt'
    | 'firstName'
    | 'lastName'
    | 'institution'
    | 'contactPhone'
    | 'address'
>;

export type AuthSession = {
    message: string;
    success: true;
    laboratory: UserLaboratory | null;
    refreshToken: string;
    accessToken: string;
    user: {
        firstName: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastName: string | null;
        institution: string | null;
        contactPhone: string | null;
        confirmedEmail: boolean;
        address: string | null;
        email: string;
        userId: string;
    };
};

export async function issueAuthSession(user: SessionUser): Promise<AuthSession> {
    const secret = process.env.PRIVATE_KEY;
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
        throw new Error('PRIVATE_KEY is not configured or invalid');
    }

    const payload = {
        userId: user.id,
        email: user.email,
        confirmedEmail: user.confirmedEmail,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        institution: user.institution,
        contactPhone: user.contactPhone,
        address: user.address,
    };

    const accessToken = jwt.sign(payload, secret, { algorithm: 'RS256', expiresIn: '1d' });
    const refreshToken = jwt.sign(payload, secret, { algorithm: 'RS256', expiresIn: '7d' });

    const laboratory = await prismaClient.userLaboratory.findFirst({
        where: { userId: user.id },
    });

    return {
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
    };
}
