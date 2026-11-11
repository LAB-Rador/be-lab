import { Router } from 'express';

import {
    getAllLaboratories,
} from '../controllers/laboratory/get.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';

const userLaboratoryRouter = Router();

rejectForeignUserParam(userLaboratoryRouter, 'userId');

userLaboratoryRouter.get('/:userId', getAllLaboratories);

export default userLaboratoryRouter;
