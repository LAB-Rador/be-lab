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
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { requirePaidPlan } from '../middleware/require-paid-plan.js';
import { Router } from 'express';

const experimentRouter = Router();

rejectForeignUserParam(experimentRouter, 'userId');

experimentRouter.patch('/unique/:userId/:labId/:experimentId/tasks/:taskId/status', requirePaidPlan, patchExperimentTaskStatus);
experimentRouter.delete('/:userId/:labId/:experimentId/members/:targetUserId', requirePaidPlan, removeExperimentMember);
experimentRouter.delete('/:userId/:labId/:experimentId/animals/:animalId', requirePaidPlan, removeExperimentAnimal);
experimentRouter.delete('/unique/:userId/:labId/:experimentId/tasks/:taskId', requirePaidPlan, deleteExperimentTask);
experimentRouter.put('/unique/:userId/:labId/:experimentId/tasks/:taskId', requirePaidPlan, updateExperimentTask);
experimentRouter.get('/unique/:userId/:labId/:experimentId/records', requirePaidPlan, getExperimentAnimalRecords);
experimentRouter.get('/unique/:userId/:labId/:experimentId/tasks', requirePaidPlan, getPaginatedExperimentTasks);
experimentRouter.get('/unique/:userId/:labId/:experimentId/metrics', requirePaidPlan, getExperimentMetrics);
experimentRouter.post('/unique/:userId/:labId/:experimentId/tasks', requirePaidPlan, createExperimentTask);
experimentRouter.get('/unique/:userId/:labId/:experimentId', requirePaidPlan, getUniqueExperimentById);
experimentRouter.post('/:userId/:labId/:experimentId/unarchive', requirePaidPlan, unarchiveExperiment);
experimentRouter.post('/:userId/:labId/:experimentId/members', requirePaidPlan, addExperimentMember);
experimentRouter.post('/:userId/:labId/:experimentId/animals', requirePaidPlan, addExperimentAnimal);
experimentRouter.post('/:userId/:labId/:experimentId/archive', requirePaidPlan, archiveExperiment);
experimentRouter.get('/:userId/:labId', requirePaidPlan, getAllExperiments);
experimentRouter.post('/experiment', requirePaidPlan, createExperiment);
export default experimentRouter;
