import { rejectForeignUserParam } from '../middleware/require-user.js';
import { getAnimalTypes, getAnimalTypeById } from '../controllers/animal/animal-types.controller.js';
import { deleteAnimalType, updateAnimalType } from '../controllers/animal/update.animal-type.controller.js';
import { createAnimalType } from '../controllers/animal/create-animal-type.controller.js';
import { getAnimalGenealogy } from '../controllers/breeding/genealogy.controller.js';
import { getUniqueAnimalById } from '../controllers/animal/get.unique.animal.byId.js';
import { archiveAnimal, unarchiveAnimal } from '../controllers/animal/animal.archive.controller.js';
import { editAnimal } from '../controllers/animal/edit.animal.controller.js';
import { getAnimalSummary } from '../controllers/animal/animal.summary.controller.js';
import { getAllAnimals } from '../controllers/animal/animals.controller.js';
import { addAnimal } from '../controllers/animal/add.animal.controller.js';
import { Router } from 'express';

const animalRouter = Router();

rejectForeignUserParam(animalRouter, 'userId');

animalRouter.post('/animal/:userId/:labId/:animalId/unarchive', unarchiveAnimal);
animalRouter.post('/animal/:userId/:labId/:animalId/archive', archiveAnimal);
animalRouter.get('/animal/:userId/:labId/:animalId/genealogy', getAnimalGenealogy);
animalRouter.get('/animal/:userId/:labId/:animalId/:rows/:page', getUniqueAnimalById);

animalRouter.get('/:userId/:labId/summary', getAnimalSummary);
animalRouter.get('/:userId/:labId/:rows/:page/:filters', getAllAnimals);
animalRouter.post('/', addAnimal);
animalRouter.put('/', editAnimal);

// Animal types routes
animalRouter.put('/types/:userId/:labId/:animalTypeId', updateAnimalType);
animalRouter.delete('/types/:userId/:labId/:animalTypeId', deleteAnimalType);
animalRouter.post('/types/:userId/:labId', createAnimalType);
animalRouter.get('/type/:animalTypeId', getAnimalTypeById);
animalRouter.get('/types/:userId/:labId', getAnimalTypes);

export default animalRouter;