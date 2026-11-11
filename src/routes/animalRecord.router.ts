import { listMedicalRecords } from '../controllers/animalRecord/list.medical.controller.js';
import { addAnimalRecord } from '../controllers/animalRecord/add.animal.record.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { Router } from 'express';

const animalRecordRouter = Router();

rejectForeignUserParam(animalRecordRouter, 'userId');

animalRecordRouter.get('/:userId/:labId/:animalId', listMedicalRecords);
animalRecordRouter.post('/', addAnimalRecord);

export default animalRecordRouter;


