import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { ApiError } from '../../utils/ApiError';
import { LoginInput, RegisterInput } from './auth.validation';

const publicUser = (u: { id: string; name: string; email: string; role: Role }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(input.password),
      },
    });
    return { user: publicUser(user), token: signToken({ sub: user.id, email: user.email, role: user.role, name: user.name }) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Generic message — never reveal whether the email exists.
    const invalid = () => ApiError.unauthorized('Invalid credentials');

    if (!user || !user.isActive) throw invalid();

    // ── Lockout check ──────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw ApiError.unauthorized(`Account locked. Try again in ${mins} minute(s).`);
    }

    const ok = await verifyPassword(input.password, user.passwordHash);

    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= env.MAX_FAILED_LOGINS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + env.LOCKOUT_MINUTES * 60000) : null,
        },
      });
      if (shouldLock) {
        throw ApiError.unauthorized(`Too many failed attempts. Account locked for ${env.LOCKOUT_MINUTES} minutes.`);
      }
      const left = env.MAX_FAILED_LOGINS - attempts;
      throw ApiError.unauthorized(`Invalid credentials. ${left} attempt(s) left before lockout.`);
    }

    // Optional role check from the login screen dropdown.
    if (input.role && input.role !== user.role) {
      throw ApiError.unauthorized(`This account is not a ${input.role.replace('_', ' ').toLowerCase()}`);
    }

    // ── Success — reset counters ───────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return { user: publicUser(user), token: signToken({ sub: user.id, email: user.email, role: user.role, name: user.name }) };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return publicUser(user);
  },
};
