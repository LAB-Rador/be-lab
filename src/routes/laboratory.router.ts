import { Router } from 'express';

import { getAllLaboratoryMembers } from '../controllers/laboratory/userLaboratory.js';
import { createLaboratory } from '../controllers/laboratory/create.controller.js';

const laboratoryRouter = Router();

laboratoryRouter.get('/:userId/:labId/', getAllLaboratoryMembers);
laboratoryRouter.post('/', createLaboratory);

export default laboratoryRouter;
