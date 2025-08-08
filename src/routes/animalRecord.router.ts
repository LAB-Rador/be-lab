import { addAnimalRecord } from '../controllers/animalRecord/add.animal.record.controller.js';
import { Router } from 'express';

const animalRecordRouter = Router();

// Create animal record with optional measurements
animalRecordRouter.post('/', addAnimalRecord);

export default animalRecordRouter;


