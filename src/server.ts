import { env } from './config/env.js';
import { connectMongo } from './db/mongo.js';
import app from './app.js';
import { registerBuiltinPlugins } from './plugins/index.js';
import { startScheduler } from './scheduler/scheduler.js';

async function main() {
  await connectMongo();
  registerBuiltinPlugins();
  if (process.env.START_SCHEDULER === '1') startScheduler().catch(err=>console.error('Scheduler failed',err));
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

main().catch((err)=>{
  console.error('Fatal:', err);
  process.exit(1);
});
