import { Router } from 'express';

import { consumeMagicLink, requestMagicLink } from '../controllers/auth/magicLink.controller.js';
import { validateToken } from '../controllers/auth/validateToken.controller.js';
import { login } from '../controllers/auth/login.controller.js';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/magic-link', requestMagicLink);
authRouter.post('/magic-link/consume', consumeMagicLink);
authRouter.get('/validate', validateToken);

export default authRouter;
