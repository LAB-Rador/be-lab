import { getLandingStats } from '../controllers/public/landing-stats.controller.js';
import { Router } from 'express';

const publicRouter = Router();

publicRouter.get('/landing-stats', getLandingStats);

export default publicRouter;
