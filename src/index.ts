import userLaboratoryRouter from './routes/userLaboratory.router.js';
import animalRecordRouter from './routes/animalRecord.router.js';
import laboratoryRouter from './routes/laboratory.router.js';
import experimentRouter from './routes/experiment.router.js';
import invitationRouter from './routes/invitation.router.js';
import animalRouter from './routes/animal.router.js';
import taskRouter from './routes/task.router.js';
import userRouter from './routes/user.router.js';
import authRouter from './routes/auth.router.js';
import { prismaClient } from './lib/prisma.js';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8080;

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL
  : [
      'https://lab-rador-assist.vercel.app',
    ];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Обработка preflight запросов для всех роутов
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/laboratories', userLaboratoryRouter);
app.use('/api/animal-records', animalRecordRouter);
app.use('/api/experiments', experimentRouter);
app.use('/api/laboratory', laboratoryRouter);
app.use('/api/invitation', invitationRouter);
app.use('/api/animals', animalRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(
  (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
  ) => {
      console.error('Error:', err.message);
      console.error('Stack:', err.stack);
      
      if (err.message === 'Not allowed by CORS') {
          res.status(403).json({ error: 'CORS policy violation' });
      } else {
          res.status(500).json({ error: 'Something went wrong!' });
      }
  },
);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// Graceful shutdown
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
