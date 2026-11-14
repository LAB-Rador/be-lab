import request from 'supertest';
import { prismaClient } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { createLaboratory } from './fixtures.js';
import { sessionToken } from './session.js';

describe('one laboratory on the free plan', () => {
    it('rejects a second laboratory for an owner', async () => {
        const { user } = await createLaboratory({ name: 'Free', maxUsers: 1, price: 0 });
        const before = await prismaClient.laboratory.count();

        const response = await request(app)
            .post('/api/laboratory')
            .set('Authorization', `Bearer ${sessionToken(user.id)}`)
            .send({
                userId: user.id,
                name: 'Second laboratory',
                username: 'second-owner',
                position: 'PI',
            });

        const after = await prismaClient.laboratory.count();
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('The Free plan includes one laboratory.');
        expect(after).toBe(before);
    });
});
