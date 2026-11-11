import { assignAnimalToCage, createCage, getCage, listCages, removeAnimalFromCage } from '../controllers/cage/cage.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { requirePaidPlan } from '../middleware/require-paid-plan.js';
import { Router } from 'express';

const cageRouter = Router();

rejectForeignUserParam(cageRouter, 'userId');

cageRouter.get('/:userId/:labId', requirePaidPlan, listCages);
cageRouter.get('/:userId/:labId/:cageId', requirePaidPlan, getCage);
cageRouter.post('/:userId/:labId', requirePaidPlan, createCage);
cageRouter.post('/:userId/:labId/:cageId/animals', requirePaidPlan, assignAnimalToCage);
cageRouter.delete('/:userId/:labId/:cageId/animals/:animalId', requirePaidPlan, removeAnimalFromCage);

export default cageRouter;
