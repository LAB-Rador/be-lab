import { Router } from 'express';

import { rejectForeignUserParam } from '../middleware/require-user.js';
import { requirePaidPlan } from '../middleware/require-paid-plan.js';
import {
    getUserById,
    updateProfile,
} from '../controllers/user/user.controller.js';
import {
    getUserNotifications,
    patchNotificationRead,
} from '../controllers/notification/notification.controller.js';

const userRouter = Router();

rejectForeignUserParam(userRouter, 'id');

userRouter.get('/:id/notifications', requirePaidPlan, getUserNotifications);
userRouter.patch('/:id/notifications/:notificationId/read', requirePaidPlan, patchNotificationRead);
userRouter.get('/:id', getUserById);
userRouter.put('/:id/profile', updateProfile);

export default userRouter;
