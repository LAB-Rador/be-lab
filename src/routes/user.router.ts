import { Router } from 'express';

import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from '../controllers/user/user.controller';
import {
    createUser,
} from '../controllers/user/create.controller';

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
