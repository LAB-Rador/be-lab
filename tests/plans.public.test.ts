import request from 'supertest';
import { prismaClient } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { assertTestDatabase } from './fixtures.js';

const expected = [
    { name: 'Free', price: 0 },
    { name: 'Starter', price: 399 },
    { name: 'Lab', price: 549 },
    { name: 'Group', price: 799 },
    { name: 'Team', price: 999 },
];

describe('public price card', () => {
    it('returns the five yearly USD plans', async () => {
        assertTestDatabase();
        const response = await request(app).get('/api/public/plans');

        expect(response.status).toBe(200);
        expect(response.body.data.map((plan: { name: string; price: number }) => ({
            name: plan.name,
            price: plan.price,
        }))).toEqual(expected);

        const stored = await prismaClient.plan.findMany({
            where: { isActive: true, name: { in: expected.map((plan) => plan.name) } },
            select: { name: true, currency: true },
        });
        expect(stored).toHaveLength(5);
        expect(stored.every((plan) => plan.currency === 'USD')).toBe(true);
    });
});
