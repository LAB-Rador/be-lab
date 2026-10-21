import { listMedicalRecords } from '../controllers/animalRecord/list.medical.controller.js';
import { addAnimalRecord } from '../controllers/animalRecord/add.animal.record.controller.js';
import { Router } from 'express';

const animalRecordRouter = Router();

animalRecordRouter.get('/:userId/:labId/:animalId', listMedicalRecords);
animalRecordRouter.post('/', addAnimalRecord);

export default animalRecordRouter;


