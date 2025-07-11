import { Router } from 'express';
import { getAllExperiments } from '../controllers/experiment/experiment.controller.js';

const experimentRouter = Router();

experimentRouter.get('/:userId/:labId', getAllExperiments);

export default experimentRouter;
