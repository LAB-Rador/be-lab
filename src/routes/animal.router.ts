import { Router } from 'express';
import { getAllAnimals } from '../controllers/animal/animals.controller.js';

const animalRouter = Router();

animalRouter.get('/:userId/:labId', getAllAnimals);

export default animalRouter;    