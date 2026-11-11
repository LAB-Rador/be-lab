import { Router } from 'express';

import { consumeMagicLink, requestMagicLink } from '../controllers/auth/magicLink.controller.js';
import { validateToken } from '../controllers/auth/validateToken.controller.js';

const authRouter = Router();

authRouter.post('/magic-link', requestMagicLink);
authRouter.post('/magic-link/consume', consumeMagicLink);
authRouter.get('/validate', validateToken);

export default authRouter;
