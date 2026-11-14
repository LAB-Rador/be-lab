import request from 'supertest';
import { app } from '../src/app.js';
import { createLaboratory } from './fixtures.js';
import { sessionToken } from './session.js';

describe('paid routes follow the laboratory plan', () => {
    it('refuses experiments on Free and allows them on Starter', async () => {
        const free = await createLaboratory({ name: 'Free', maxUsers: 1, price: 0 });
        const starter = await createLaboratory({ name: 'Starter', maxUsers: 2, price: 399 });

        const refused = await request(app)
            .get(`/api/experiments/${free.user.id}/${free.slug}`)
            .set('Authorization', `Bearer ${sessionToken(free.user.id)}`);
        const allowed = await request(app)
            .get(`/api/experiments/${starter.user.id}/${starter.slug}`)
            .set('Authorization', `Bearer ${sessionToken(starter.user.id)}`);

        expect(refused.status).toBe(403);
        expect(refused.body.message).toBe('This feature is not included in the current plan.');
        expect(allowed.status).toBe(200);
        expect(allowed.body.success).toBe(true);
        expect(allowed.body.data).toEqual([]);
    });
});
