import { Router } from 'express';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { requirePaidPlan } from '../middleware/require-paid-plan.js';
import { getAllPendingTasks } from '../controllers/task/task.controller.js';
import {
    createLaboratoryTask,
    deleteLaboratoryTask,
    getPaginatedLaboratoryTasks,
    patchLaboratoryTaskStatus,
    updateLaboratoryTask,
} from '../controllers/task/laboratory.tasks.controller.js';

const taskRouter = Router();

rejectForeignUserParam(taskRouter, 'userId');

taskRouter.get('/laboratory/:userId/:labId', requirePaidPlan, getPaginatedLaboratoryTasks);
taskRouter.post('/laboratory/:userId/:labId', requirePaidPlan, createLaboratoryTask);
taskRouter.delete('/laboratory/:userId/:labId/:taskId', requirePaidPlan, deleteLaboratoryTask);
taskRouter.patch('/laboratory/:userId/:labId/:taskId/status', requirePaidPlan, patchLaboratoryTaskStatus);
taskRouter.put('/laboratory/:userId/:labId/:taskId', requirePaidPlan, updateLaboratoryTask);

taskRouter.get('/:userId/:labId', requirePaidPlan, getAllPendingTasks);

export default taskRouter;
