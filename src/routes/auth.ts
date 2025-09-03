import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import { UserModel } from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/register', asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const exists = await UserModel.findOne({ email: body.email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await UserModel.create({ email: body.email, passwordHash, role: 'USER' });
  const token = signJwt({ id: String(user._id), role: user.role });
  res.json({ token });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: body.email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await (async () => bcrypt.compare(body.password, user.passwordHash))();
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = signJwt({ id: String(user._id), role: user.role });
  res.json({ token });
}));

export default router;
