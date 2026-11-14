import request from 'supertest';
import { prismaClient } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { createAnimal, createLaboratory, Sex } from './fixtures.js';
import { sessionToken } from './session.js';

describe('breeding pair sex', () => {
    it('rejects two males, two females, and the same animal as both parents', async () => {
        const { user, laboratory, slug } = await createLaboratory({ name: 'Free', maxUsers: 1, price: 0 });
        const animalType = await prismaClient.animalType.create({
            data: { name: 'Mouse', laboratoryId: laboratory.id },
        });
        const maleA = await createAnimal(laboratory.id, animalType.id, 'male-a', Sex.MALE);
        const maleB = await createAnimal(laboratory.id, animalType.id, 'male-b', Sex.MALE);
        const femaleA = await createAnimal(laboratory.id, animalType.id, 'female-a', Sex.FEMALE);
        const femaleB = await createAnimal(laboratory.id, animalType.id, 'female-b', Sex.FEMALE);
        const started = new Date().toISOString();
        const post = (motherId: string, fatherId: string) => request(app)
            .post(`/api/breedings/${user.id}/${slug}`)
            .set('Authorization', `Bearer ${sessionToken(user.id)}`)
            .send({ motherId, fatherId, startDate: started });

        const males = await post(maleA.id, maleB.id);
        const females = await post(femaleA.id, femaleB.id);
        const sameAnimal = await post(maleA.id, maleA.id);

        expect(males.status).toBe(400);
        expect(males.body.message).toBe('Mother must be female and father must be male');
        expect(females.status).toBe(400);
        expect(females.body.message).toBe('Mother must be female and father must be male');
        expect(sameAnimal.status).toBe(400);
        expect(sameAnimal.body.message).toBe('Mother and father must be different animals');
    });
});
