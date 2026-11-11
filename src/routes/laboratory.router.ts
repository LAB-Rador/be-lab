import { Router } from 'express';

import { deleteLaboratoryMember } from '../controllers/laboratory/deleteUserLaboratory.js';
import { getAllLaboratoryMembers } from '../controllers/laboratory/userLaboratory.js';
import { createLaboratory } from '../controllers/laboratory/create.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';

const laboratoryRouter = Router();

rejectForeignUserParam(laboratoryRouter, 'userId');

laboratoryRouter.delete('/:userId/:labId/:userLabId', deleteLaboratoryMember);
laboratoryRouter.get('/:userId/:labId/', getAllLaboratoryMembers);
laboratoryRouter.post('/', createLaboratory);

export default laboratoryRouter;
