import { createBreedingProtocol, deleteBreedingProtocol, listBreedingProtocols, updateBreedingProtocol } from '../controllers/breeding/protocol.controller.js';
import { createBreeding } from '../controllers/breeding/create.controller.js';
import { createLitter } from '../controllers/breeding/litter.controller.js';
import { listBreedings } from '../controllers/breeding/list.controller.js';
import { Router } from 'express';

const breedingRouter = Router();

breedingRouter.get('/:userId/:labId/protocols', listBreedingProtocols);
breedingRouter.post('/:userId/:labId/protocols', createBreedingProtocol);
breedingRouter.put('/:userId/:labId/protocols/:protocolId', updateBreedingProtocol);
breedingRouter.delete('/:userId/:labId/protocols/:protocolId', deleteBreedingProtocol);
breedingRouter.get('/:userId/:labId', listBreedings);
breedingRouter.post('/:userId/:labId', createBreeding);
breedingRouter.post('/:userId/:labId/:breedingId/litters', createLitter);

export default breedingRouter;
