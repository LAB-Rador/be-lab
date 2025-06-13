import { Router } from 'express';

import {
    getAllLaboratories,
} from '../controllers/laboratory/get.controller';

const userLaboratoryRouter = Router();

userLaboratoryRouter.get('/:userId', getAllLaboratories);

export default userLaboratoryRouter;
