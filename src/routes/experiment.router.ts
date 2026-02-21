import { getUniqueExperimentById } from '../controllers/experiment/unique.experiment.controller.js';
import { createExperiment } from '../controllers/experiment/create.experiment.controller.js';
import { getAllExperiments } from '../controllers/experiment/experiment.controller.js';
import { Router } from 'express';

const experimentRouter = Router();

experimentRouter.get('/unique/:userId/:labId/:experimentId', getUniqueExperimentById);
experimentRouter.get('/:userId/:labId', getAllExperiments);
experimentRouter.post('/experiment', createExperiment);
export default experimentRouter;
