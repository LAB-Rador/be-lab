import { Router } from 'express';

import {
    createLaboratory,
} from '../controllers/laboratory/create.controller';

const laboratoryRouter = Router();

laboratoryRouter.post('/', createLaboratory);

export default laboratoryRouter;
