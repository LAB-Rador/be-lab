import { getAnimalTypes, getAnimalTypeById } from '../controllers/animal/animal-types.controller.js';
import { createAnimalType } from '../controllers/animal/create-animal-type.controller.js';
import { getAnimalEnums } from '../controllers/animal/animal-enums.controller.js';
import { editAnimal } from 'src/controllers/animal/edit.animal.controller.js';
import { getAllAnimals } from '../controllers/animal/animals.controller.js';
import { addAnimal } from '../controllers/animal/add.animal.controller.js';
import { Router } from 'express';

const animalRouter = Router();

animalRouter.get('/:userId/:labId/:rows/:page/:filters', getAllAnimals);
animalRouter.post('/', addAnimal);
animalRouter.put('/', editAnimal);

// Animal types routes
animalRouter.post('/types/:userId/:labId', createAnimalType);
animalRouter.get('/type/:animalTypeId', getAnimalTypeById);
animalRouter.get('/types/:userId/:labId', getAnimalTypes);

// Animal enums route
animalRouter.get('/enums', getAnimalEnums);

export default animalRouter;