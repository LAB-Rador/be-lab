import { Router } from 'express';

import { createResetCode, resetPassword } from '../controllers/auth/resetPassword.controller.js';
import { validateToken } from '../controllers/auth/validateToken.controller.js';
import { confirmEmail } from '../controllers/auth/email.controller.js';
import { login } from '../controllers/auth/login.controller.js';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/validate', validateToken);
authRouter.post('/confirm-email', confirmEmail);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/create-reset-code', createResetCode);
export default authRouter;
