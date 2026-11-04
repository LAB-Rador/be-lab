import { getLandingStats } from '../controllers/public/landing-stats.controller.js';
import { getPublicPlans } from '../controllers/public/plans.controller.js';
import { Router } from 'express';

const publicRouter = Router();

publicRouter.get('/landing-stats', getLandingStats);
publicRouter.get('/plans', getPublicPlans);

export default publicRouter;
