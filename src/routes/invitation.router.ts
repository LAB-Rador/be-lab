import { Router } from 'express';
import { createInvitation } from '../controllers/invitation/create.controller.js';
import { verificationInvitation } from '../controllers/invitation/verification.controller.js';

const invitationRouter = Router();

invitationRouter.post('/', createInvitation);
invitationRouter.post('/verification', verificationInvitation);

export default invitationRouter;
