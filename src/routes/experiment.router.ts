import { archiveExperiment, unarchiveExperiment } from '../controllers/experiment/experiment.archive.controller.js';
import { getExperimentAnimalRecords } from '../controllers/experiment/experiment.animal-records.controller.js';
import { removeExperimentMember } from '../controllers/experiment/remove.experiment-member.controller.js';
import { removeExperimentAnimal } from '../controllers/experiment/remove.experiment-animal.controller.js';
import { addExperimentMember } from '../controllers/experiment/add.experiment-member.controller.js';
import { addExperimentAnimal } from '../controllers/experiment/add.experiment-animal.controller.js';
import { getUniqueExperimentById } from '../controllers/experiment/unique.experiment.controller.js';
import { getExperimentMetrics } from '../controllers/experiment/experiment.metrics.controller.js';
import { createExperiment } from '../controllers/experiment/create.experiment.controller.js';
import { getAllExperiments } from '../controllers/experiment/experiment.controller.js';
import {
    createExperimentTask,
    deleteExperimentTask,
    getPaginatedExperimentTasks,
    patchExperimentTaskStatus,
    updateExperimentTask,
} from '../controllers/experiment/experiment.tasks.controller.js';
import { Router } from 'express';

const experimentRouter = Router();

experimentRouter.patch('/unique/:userId/:labId/:experimentId/tasks/:taskId/status', patchExperimentTaskStatus);
experimentRouter.delete('/:userId/:labId/:experimentId/members/:targetUserId', removeExperimentMember);
experimentRouter.delete('/:userId/:labId/:experimentId/animals/:animalId', removeExperimentAnimal);
experimentRouter.delete('/unique/:userId/:labId/:experimentId/tasks/:taskId', deleteExperimentTask);
experimentRouter.put('/unique/:userId/:labId/:experimentId/tasks/:taskId', updateExperimentTask);
experimentRouter.get('/unique/:userId/:labId/:experimentId/records', getExperimentAnimalRecords);
experimentRouter.get('/unique/:userId/:labId/:experimentId/tasks', getPaginatedExperimentTasks);
experimentRouter.get('/unique/:userId/:labId/:experimentId/metrics', getExperimentMetrics);
experimentRouter.post('/unique/:userId/:labId/:experimentId/tasks', createExperimentTask);
experimentRouter.get('/unique/:userId/:labId/:experimentId', getUniqueExperimentById);
experimentRouter.post('/:userId/:labId/:experimentId/unarchive', unarchiveExperiment);
experimentRouter.post('/:userId/:labId/:experimentId/members', addExperimentMember);
experimentRouter.post('/:userId/:labId/:experimentId/animals', addExperimentAnimal);
experimentRouter.post('/:userId/:labId/:experimentId/archive', archiveExperiment);
experimentRouter.get('/:userId/:labId', getAllExperiments);
experimentRouter.post('/experiment', createExperiment);
export default experimentRouter;
