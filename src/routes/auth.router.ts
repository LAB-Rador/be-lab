import { Router } from 'express';

import { createResetCode, resetPassword } from '../controllers/auth/resetPassword.controller';
import { validateToken } from '../controllers/auth/validateToken.controller';
import { confirmEmail } from '../controllers/auth/email.controller';
import { login } from '../controllers/auth/login.controller';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/validate', validateToken);
authRouter.post('/confirm-email', confirmEmail);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/create-reset-code', createResetCode);
export default authRouter;
