import { getLaboratorySubscription } from '../controllers/subscription/get.laboratory.subscription.controller.js';
import { Router } from 'express';

const subscriptionRouter = Router();

subscriptionRouter.get('/:userId/:labId', getLaboratorySubscription);

export default subscriptionRouter;
