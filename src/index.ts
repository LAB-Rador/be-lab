import { app } from './app.js';
import { prismaClient } from './lib/prisma.js';

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prismaClient.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prismaClient.$disconnect();
    process.exit(0);
});
