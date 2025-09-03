import { connectMongo } from '../db/mongo.js';
import { UserModel } from '../models/User.js';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectMongo();
  const email = 'admin@example.com';
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  const exists = await UserModel.findOne({ email });
  if (!exists) {
    await UserModel.create({ email, passwordHash: hash, role: 'ADMIN' });
    console.log('Seeded admin:', { email, password });
  } else {
    console.log('Admin already exists');
  }
  process.exit(0);
}

seed();
