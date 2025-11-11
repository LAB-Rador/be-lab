import { createExperiment } from '../controllers/experiment/create.experiment.controller.js';
import { getAllExperiments } from '../controllers/experiment/experiment.controller.js';
import { Router } from 'express';

const experimentRouter = Router();

experimentRouter.get('/:userId/:labId', getAllExperiments);
experimentRouter.post('/experiment', createExperiment);

export default experimentRouter;
