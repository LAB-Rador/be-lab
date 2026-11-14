import { prismaClient } from '../src/lib/prisma.js';

beforeAll(async () => {
    const url = process.env.DATABASE_URL ?? '';
    if (!url.includes('localhost:54329/labassist_test')) {
        throw new Error('Refusing to reset a database that is not the local test Postgres');
    }
    await prismaClient.$executeRawUnsafe(`
        DO $$ DECLARE
            table_row RECORD;
        BEGIN
            FOR table_row IN
                SELECT tablename FROM pg_tables WHERE schemaname = 'public'
            LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_row.tablename) || ' RESTART IDENTITY CASCADE';
            END LOOP;
        END $$;
    `);
});

afterAll(async () => {
    await prismaClient.$disconnect();
});
