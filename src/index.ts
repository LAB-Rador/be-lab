import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.router';
import authRouter from './routes/auth.router';
import laboratoryRouter from './routes/laboratory.router';
import userLaboratoryRouter from './routes/userLaboratory.router';

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  'https://lab-rador-assist.vercel.app',
  'https://lab-radar-assist.vercel.app', // исправленный домен из логов
  'http://localhost:3000',
  'http://localhost:3001',
  // добавьте другие домены если нужно
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Разрешить запросы без origin (например, мобильные приложения)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          console.log('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
      }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400, // 24 часа для preflight cache
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
app.use('/api/laboratory', laboratoryRouter);
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
