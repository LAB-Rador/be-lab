import { Router } from 'express';

import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user/user.controller.js';
import {
    getUserNotifications,
    patchNotificationRead,
} from '../controllers/notification/notification.controller.js';

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id/notifications', getUserNotifications);
userRouter.patch('/:id/notifications/:notificationId/read', patchNotificationRead);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
