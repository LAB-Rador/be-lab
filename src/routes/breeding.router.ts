import { createBreeding } from '../controllers/breeding/create.controller.js';
import { listBreedings } from '../controllers/breeding/list.controller.js';
import { Router } from 'express';

const breedingRouter = Router();

breedingRouter.get('/:userId/:labId', listBreedings);
breedingRouter.post('/:userId/:labId', createBreeding);

export default breedingRouter;
