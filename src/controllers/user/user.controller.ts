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

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userClient.findMany({ select: publicUserSelect });
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

function optionalText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
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
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const firstName = optionalText(req.body?.firstName);
        if (!firstName) {
            return res.status(400).json({
                success: false,
                message: 'First name is required.',
            });
        }

        const user = await userClient.update({
            where: { id: userId },
            data: {
                firstName,
                lastName: optionalText(req.body?.lastName),
                institution: optionalText(req.body?.institution),
                contactPhone: optionalText(req.body?.contactPhone),
                address: optionalText(req.body?.address),
            },
            select: publicUserSelect,
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error update profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
};

const profileFields = ['firstName', 'lastName', 'address', 'contactPhone', 'institution'] as const;

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const body = (req.body ?? {}) as Record<string, unknown>;
        const data: Record<string, string | null> = {};
        for (const key of profileFields) {
            if (!(key in body)) continue;
            const value = body[key];
            if (value === null) data[key] = null;
            else if (typeof value === 'string') data[key] = value.trim() || null;
        }
        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No profile fields to update',
            });
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
