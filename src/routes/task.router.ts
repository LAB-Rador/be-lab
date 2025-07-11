import { Router } from 'express';
import { getAllPendingTasks } from '../controllers/task/task.controller.js';

const taskRouter = Router();

taskRouter.get('/:userId/:labId', getAllPendingTasks);

export default taskRouter;
