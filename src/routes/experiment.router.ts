import { getUniqueExperimentById } from '../controllers/experiment/unique.experiment.controller.js';
import { createExperiment } from '../controllers/experiment/create.experiment.controller.js';
import { getAllExperiments } from '../controllers/experiment/experiment.controller.js';
import { addExperimentMember } from '../controllers/experiment/add.experiment-member.controller.js';
import { removeExperimentMember } from '../controllers/experiment/remove.experiment-member.controller.js';
import { Router } from 'express';

const experimentRouter = Router();

experimentRouter.get('/unique/:userId/:labId/:experimentId', getUniqueExperimentById);
experimentRouter.post('/:userId/:labId/:experimentId/members', addExperimentMember);
experimentRouter.delete('/:userId/:labId/:experimentId/members/:targetUserId', removeExperimentMember);
experimentRouter.get('/:userId/:labId', getAllExperiments);
experimentRouter.post('/experiment', createExperiment);
export default experimentRouter;
