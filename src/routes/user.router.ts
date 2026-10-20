import { Router } from 'express';

import {
    getAllUsers,
    getUserById,
    updateUser,
    updateProfile,
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
userRouter.put('/:id/profile', updateProfile);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
