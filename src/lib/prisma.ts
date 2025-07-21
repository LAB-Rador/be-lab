import { PrismaClient } from '@prisma/client'

// Расширяем глобальный объект для TypeScript
declare global {
  var __prisma: PrismaClient;
}

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaClient = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} else {
  // Prevent multiple instances during development hot-reload
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  prismaClient = global.__prisma;
}

export { prismaClient };