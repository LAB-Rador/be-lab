import request from 'supertest';
import { app } from '../src/app.js';
import { sessionToken } from './session.js';

const ownerId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';

describe('session on a domain route', () => {
    it('rejects a request without a bearer token', async () => {
        const response = await request(app).get(`/api/users/${ownerId}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication required');
    });

    it('rejects a token whose user does not match the path', async () => {
        const response = await request(app)
            .get(`/api/users/${otherId}`)
            .set('Authorization', `Bearer ${sessionToken(ownerId)}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Access denied');
    });
});
