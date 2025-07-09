import { Router } from 'express';
import { getAllAnimals } from '../controllers/animal/animals.controller.js';
import { addAnimal } from '../controllers/animal/add.animal.controller.js';
import { getAnimalTypes, getAnimalTypeById } from '../controllers/animal/animal-types.controller.js';
import { createAnimalType } from '../controllers/animal/create-animal-type.controller.js';
import { getAnimalEnums } from '../controllers/animal/animal-enums.controller.js';

const animalRouter = Router();

animalRouter.get('/:userId/:labId', getAllAnimals);
animalRouter.post('/', addAnimal);

// Animal types routes
animalRouter.get('/types/:userId/:labId', getAnimalTypes);
animalRouter.get('/type/:animalTypeId', getAnimalTypeById);
animalRouter.post('/types/:userId/:labId', createAnimalType);

// Animal enums route
animalRouter.get('/enums', getAnimalEnums);

export default animalRouter;