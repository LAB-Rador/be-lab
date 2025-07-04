import { Router } from 'express';
import { getAllPendingTaskCount } from '../controllers/task/task.controller.js';

const taskCountRouter = Router();

taskCountRouter.get('/:userId/:labId', getAllPendingTaskCount);

export default taskCountRouter;
