import { Router } from 'express';

import {
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user/user.controller.js';
import {
    createUser,
} from '../controllers/user/create.controller.js';
import {
    getUserNotifications,
    patchNotificationRead,
} from '../controllers/notification/notification.controller.js';
import { requireAuth, requireSelfUserId } from '../middleware/requireAuth.middleware.js';

const userRouter = Router();

userRouter.post('/', createUser);

userRouter.use(requireAuth);

userRouter.get('/:id/notifications', requireSelfUserId('id'), getUserNotifications);
userRouter.patch(
    '/:id/notifications/:notificationId/read',
    requireSelfUserId('id'),
    patchNotificationRead,
);
userRouter.get('/:id', requireSelfUserId('id'), getUserById);
userRouter.put('/:id', requireSelfUserId('id'), updateUser);
userRouter.delete('/:id', requireSelfUserId('id'), deleteUser);

export default userRouter;
