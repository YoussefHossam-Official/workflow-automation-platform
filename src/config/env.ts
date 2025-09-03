import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/workflow_automation_dev',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
