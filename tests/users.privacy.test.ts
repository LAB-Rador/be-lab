import request from 'supertest';
import { app } from '../src/app.js';

describe('user catalog without a session', () => {
    it('does not list users', async () => {
        const response = await request(app).get('/api/users');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication required');
    });

    it('does not delete a user', async () => {
        const response = await request(app).delete('/api/users/11111111-1111-4111-8111-111111111111');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication required');
    });
});
