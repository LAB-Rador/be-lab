const { generateKeyPairSync } = require('node:crypto');

const databaseUrl = 'postgresql://egorkolev@localhost:54329/labassist_test?schema=public';
process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_URL = databaseUrl;

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
