import { randomUUID } from 'node:crypto';
import { AccessStatus, Role } from '@prisma/client';
import request from 'supertest';
import { prismaClient } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { createLaboratory } from './fixtures.js';
import { sessionToken } from './session.js';

describe('removing a member', () => {
    it('removes a member who has no invitation', async () => {
        const { user, laboratory, slug } = await createLaboratory({ name: 'Free', maxUsers: 1, price: 0 });
        const member = await prismaClient.user.create({
            data: {
                email: `member-${randomUUID()}@labassist.test`,
                confirmedEmail: true,
                firstName: 'Member',
            },
        });
        const membership = await prismaClient.userLaboratory.create({
            data: {
                userId: member.id,
                laboratoryId: laboratory.id,
                role: Role.MEMBER,
                accessStatus: AccessStatus.ACTIVE,
            },
        });

        const response = await request(app)
            .delete(`/api/laboratory/${user.id}/${slug}/${membership.id}`)
            .set('Authorization', `Bearer ${sessionToken(user.id)}`);

        const remaining = await prismaClient.userLaboratory.findUnique({ where: { id: membership.id } });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(remaining).toBeNull();
    });
});
