import request from 'supertest';
import { app } from '../src/app.js';
import { createLaboratory } from './fixtures.js';
import { sessionToken } from './session.js';

describe('free plan seat limit', () => {
    it('rejects a second invitation when the plan allows one user', async () => {
        const { user, slug } = await createLaboratory({ name: 'Free', maxUsers: 1, price: 0 });

        const response = await request(app)
            .post('/api/invitation')
            .set('Authorization', `Bearer ${sessionToken(user.id)}`)
            .send({
                email: 'second@labassist.test',
                fullName: 'Second Member',
                role: 'MEMBER',
                labId: slug,
                invitedBy: user.id,
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('This plan allows 1 user.');
    });
});
