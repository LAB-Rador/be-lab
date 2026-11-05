import { assignAnimalToCage, createCage, listCages, removeAnimalFromCage } from '../controllers/cage/cage.controller.js';
import { Router } from 'express';

const cageRouter = Router();

cageRouter.get('/:userId/:labId', listCages);
cageRouter.post('/:userId/:labId', createCage);
cageRouter.post('/:userId/:labId/:cageId/animals', assignAnimalToCage);
cageRouter.delete('/:userId/:labId/:cageId/animals/:animalId', removeAnimalFromCage);

export default cageRouter;
