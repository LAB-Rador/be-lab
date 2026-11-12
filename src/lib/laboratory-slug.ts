import { prismaClient } from './prisma.js';

const RESERVED = new Set(['account', 'signin', 'privacy', 'pricing', 'laboratory-setup', 'api', 'auth']);

export function slugFromName(name: string) {
    const base = name
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    return base.length > 0 ? base : 'lab';
}

export async function allocateLaboratorySlug(name: string) {
    const base = slugFromName(name);
    const rows = await prismaClient.laboratory.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
    });
    const taken = new Set(rows.map((row) => row.slug));
    if (!taken.has(base) && !RESERVED.has(base)) return base;
    let suffix = 2;
    while (taken.has(`${base}-${suffix}`)) {
        suffix += 1;
    }
    return `${base}-${suffix}`;
}
