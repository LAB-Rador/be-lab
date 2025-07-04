import { Router } from 'express';
import { getAllExperimentCount } from '../controllers/experiment/experiment.controller.js';

const experimentCountRouter = Router();

experimentCountRouter.get('/:userId/:labId', getAllExperimentCount);

export default experimentCountRouter;
