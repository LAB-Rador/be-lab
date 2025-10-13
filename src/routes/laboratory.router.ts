import { Router } from 'express';

import { deleteLaboratoryMember } from '../controllers/laboratory/deleteUserLaboratory.js';
import { getAllLaboratoryMembers } from '../controllers/laboratory/userLaboratory.js';
import { createLaboratory } from '../controllers/laboratory/create.controller.js';

const laboratoryRouter = Router();

laboratoryRouter.delete('/:userId/:labId/:userLabId', deleteLaboratoryMember);
laboratoryRouter.get('/:userId/:labId/', getAllLaboratoryMembers);
laboratoryRouter.post('/', createLaboratory);

export default laboratoryRouter;
