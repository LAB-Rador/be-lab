import jwt from 'jsonwebtoken';

export function sessionToken(userId: string) {
    const key = process.env.PRIVATE_KEY;
    if (!key) throw new Error('Test signing key is missing');
    return jwt.sign({ userId }, key, { algorithm: 'RS256', expiresIn: '5m' });
}
