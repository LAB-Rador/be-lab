import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const validateToken = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token is defined',
        });
    }

    jwt.verify(token, process.env.PRIVATE_KEY_PATH!, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token is invalid' });
        }

        if (typeof decoded === 'object' && decoded !== null) {
            res.json({
                success: true,
                user: {
                    userId: decoded.userId,
                    email: decoded.email,
                    confirmedEmail: decoded.confirmedEmail,
                    createdAt: decoded.createdAt,
                    firstName: decoded.firstName,
                    lastName: decoded.lastName,
                    institution: decoded.institution,
                    contactPhone: decoded.contactPhone,
                    address: decoded.address,
                },
            });
        }
    });
};
