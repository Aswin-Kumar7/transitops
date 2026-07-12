import { Router } from 'express';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
