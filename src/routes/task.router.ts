import { Router } from 'express';
import { getAllPendingTasks } from '../controllers/task/task.controller.js';
import {
    createLaboratoryTask,
    deleteLaboratoryTask,
    getPaginatedLaboratoryTasks,
    patchLaboratoryTaskStatus,
    updateLaboratoryTask,
} from '../controllers/task/laboratory.tasks.controller.js';

const taskRouter = Router();

taskRouter.get('/laboratory/:userId/:labId', getPaginatedLaboratoryTasks);
taskRouter.post('/laboratory/:userId/:labId', createLaboratoryTask);
taskRouter.delete('/laboratory/:userId/:labId/:taskId', deleteLaboratoryTask);
taskRouter.patch('/laboratory/:userId/:labId/:taskId/status', patchLaboratoryTaskStatus);
taskRouter.put('/laboratory/:userId/:labId/:taskId', updateLaboratoryTask);

taskRouter.get('/:userId/:labId', getAllPendingTasks);

export default taskRouter;
