import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { issueAuthSession } from '../../lib/issue-auth-session.js';
import { prismaClient } from '../../lib/prisma.js';

const authClient = prismaClient;

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await authClient.user.findUnique({
            where: { email },
        });

        if (!user?.password || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({
                success: false,
                error: 'Please check your login details and try again',
            });
        }

        const session = await issueAuthSession(user);
        res.status(200).json(session);
    } catch (error) {
        console.error('An error occurred. Please try again later:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred. Please try again later',
        });
    }
};
