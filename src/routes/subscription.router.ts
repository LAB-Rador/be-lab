import { getLaboratorySubscription } from '../controllers/subscription/get.laboratory.subscription.controller.js';
import { rejectForeignUserParam } from '../middleware/require-user.js';
import { Router } from 'express';

const subscriptionRouter = Router();

rejectForeignUserParam(subscriptionRouter, 'userId');

subscriptionRouter.get('/:userId/:labId', getLaboratorySubscription);

export default subscriptionRouter;
