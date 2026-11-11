import { assignAnimalToCage, createCage, getCage, listCages, removeAnimalFromCage } from '../controllers/cage/cage.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { Router } from 'express';

const cageRouter = Router();

rejectForeignUserParam(cageRouter, 'userId');

cageRouter.get('/:userId/:labId', listCages);
cageRouter.get('/:userId/:labId/:cageId', getCage);
cageRouter.post('/:userId/:labId', createCage);
cageRouter.post('/:userId/:labId/:cageId/animals', assignAnimalToCage);
cageRouter.delete('/:userId/:labId/:cageId/animals/:animalId', removeAnimalFromCage);

export default cageRouter;
