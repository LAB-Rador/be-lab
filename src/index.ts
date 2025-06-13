import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.router';
import authRouter from './routes/auth.router';
import laboratoryRouter from './routes/laboratory.router';
import userLaboratoryRouter from './routes/userLaboratory.router';

const app = express();
const port = process.env.PORT || 3001;

app.use(
    cors({
        origin: [
            'http://localhost:3000', // Next.js default port
            'http://localhost:3001', // Your backend port
            'http://127.0.0.1:3000',
        ],
        credentials: true, // Allow cookies and auth headers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

app.use(express.json());

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
        console.error(err.stack);
        res.status(500).json({ error: 'Something went wrong!' });
    },
);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
