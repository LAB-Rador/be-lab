import { Prisma } from '@prisma/client';

export const pedigreeAnimalSelect = {
    id: true,
    identifier: true,
    name: true,
    sex: true,
    status: true,
    birthDate: true,
    animalType: { select: { name: true } },
} satisfies Prisma.AnimalSelect;

type PedigreeRow = Prisma.AnimalGetPayload<{ select: typeof pedigreeAnimalSelect }>;

export function toPedigreeAnimal(animal: PedigreeRow) {
    return {
        id: animal.id,
        identifier: animal.identifier,
        name: animal.name,
        sex: animal.sex,
        status: animal.status,
        birthDate: animal.birthDate,
        animalType: animal.animalType.name,
    };
}

export function uniquePedigree(animals: Array<PedigreeRow | null | undefined>) {
    const byId = new Map<string, ReturnType<typeof toPedigreeAnimal>>();
    for (const animal of animals) {
        if (!animal || byId.has(animal.id)) continue;
        byId.set(animal.id, toPedigreeAnimal(animal));
    }
    return [...byId.values()];
}
