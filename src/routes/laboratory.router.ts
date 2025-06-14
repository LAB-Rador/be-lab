import { Router } from 'express';

import {
    createLaboratory,
} from '../controllers/laboratory/create.controller.js';

const laboratoryRouter = Router();

laboratoryRouter.post('/', createLaboratory);

export default laboratoryRouter;
