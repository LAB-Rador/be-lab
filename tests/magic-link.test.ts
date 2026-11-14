import { randomUUID } from 'node:crypto';
import { LoginTokenPurpose } from '@prisma/client';
import request from 'supertest';
import { hashToken } from '../src/lib/token-hash.js';
import { prismaClient } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { assertTestDatabase } from './fixtures.js';

async function consume(raw: string) {
    return request(app).post('/api/auth/magic-link/consume').send({ token: raw });
}

describe('magic link consumption', () => {
    it('rejects a token that was already used', async () => {
        assertTestDatabase();
        const raw = `used-${randomUUID()}`;
        await prismaClient.loginToken.create({
            data: {
                email: `used-${randomUUID()}@labassist.test`,
                tokenHash: hashToken(raw),
                purpose: LoginTokenPurpose.SIGN_IN,
                expiresAt: new Date(Date.now() + 60_000),
                usedAt: new Date(),
            },
        });

        const response = await consume(raw);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('This link is invalid or has expired.');
    });

    it('rejects an expired token', async () => {
        const raw = `expired-${randomUUID()}`;
        await prismaClient.loginToken.create({
            data: {
                email: `expired-${randomUUID()}@labassist.test`,
                tokenHash: hashToken(raw),
                purpose: LoginTokenPurpose.SIGN_IN,
                expiresAt: new Date(Date.now() - 60_000),
            },
        });

        const response = await consume(raw);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('This link is invalid or has expired.');
    });
});
