import { PrismaClient } from '@prisma/client'

// Расширяем глобальный объект для TypeScript
declare global {
  var __prisma: PrismaClient;
}

let prismaClient: PrismaClient;

// Всегда используем глобальную переменную для предотвращения множественных экземпляров
if (!global.__prisma) {
  global.__prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
}

prismaClient = global.__prisma;

export { prismaClient };