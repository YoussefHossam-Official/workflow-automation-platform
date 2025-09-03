import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayloadShape { id: string; role: 'ADMIN'|'USER'; }

export function signJwt(payload: JwtPayloadShape) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayloadShape {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayloadShape;
}
