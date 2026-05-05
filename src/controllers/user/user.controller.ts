import type { Request, Response } from 'express';
import { prismaClient } from '../../lib/prisma.js';

const userClient = prismaClient.user;

const userPublicSelect = {
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

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userClient.findMany({ select: userPublicSelect });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await userClient.findUnique({
            where: {
                id: userId,
            },
            select: userPublicSelect,
        });
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

const updatableProfileKeys = [
    'firstName',
    'lastName',
    'address',
    'contactPhone',
    'institution',
] as const;

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const body = req.body as Record<string, unknown>;
        const data: Record<string, string | null> = {};
        for (const key of updatableProfileKeys) {
            if (!(key in body)) continue;
            const v = body[key];
            if (v === null) {
                data[key] = null;
            } else if (typeof v === 'string') {
                data[key] = v;
            }
        }
        const user = await userClient.update({
            where: {
                id: userId,
            },
            data,
        });

        const { password, ...successUser } = user;
        res.status(200).json({ success: true, data: successUser });
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
        });

        const { password, ...successUser } = user;
        res.status(200).json({ success: true, data: successUser });
    } catch (error) {
        console.error('Error delete user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
