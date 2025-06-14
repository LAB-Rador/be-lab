import type { Request, Response } from 'express';
import prismaClient from '../../lib/prisma.js';

const userClient = prismaClient.user;

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userClient.findMany();
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

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const userData = req.body;
        const user = await userClient.update({
            where: {
                id: userId,
            },
            data: userData,
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
