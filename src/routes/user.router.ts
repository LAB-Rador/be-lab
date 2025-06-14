import { Router } from 'express';

import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user/user.controller.js';
import {
    createUser,
} from '../controllers/user/create.controller.js';

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
