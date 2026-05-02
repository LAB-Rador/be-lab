import type { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';

const userClient = prismaClient.user;

const publicUserSelect = {
    id: true,
    email: true,
    address: true,
    contactPhone: true,
    firstName: true,
    lastName: true,
    institution: true,
    confirmedEmail: true,
    createdAt: true,
    updatedAt: true,
} as const;

const updatableProfileKeys = [
    'firstName',
    'lastName',
    'address',
    'contactPhone',
    'institution',
] as const;

function pickProfileUpdates(body: unknown): Record<string, string | null | undefined> {
    if (body === null || typeof body !== 'object') return {};
    const src = body as Record<string, unknown>;
    const out: Record<string, string | null | undefined> = {};
    for (const key of updatableProfileKeys) {
        if (Object.prototype.hasOwnProperty.call(src, key)) {
            const v = src[key];
            if (v === null || v === undefined) {
                out[key] = v === null ? null : undefined;
            } else if (typeof v === 'string') {
                out[key] = v;
            }
        }
    }
    return out;
}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await userClient.findUnique({
            where: {
                id: userId,
            },
            select: publicUserSelect,
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const data = pickProfileUpdates(req.body);
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid profile fields to update' });
        }
        const user = await userClient.update({
            where: {
                id: userId,
            },
            data,
            select: publicUserSelect,
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error update user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await userClient.delete({
            where: {
                id: userId,
            },
            select: publicUserSelect,
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error delete user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
