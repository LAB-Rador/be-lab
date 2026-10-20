import { Router } from 'express';
import { createInvitation } from '../controllers/invitation/create.controller.js';

const invitationRouter = Router();

invitationRouter.post('/', createInvitation);

export default invitationRouter;
