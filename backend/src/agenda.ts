import Agenda from 'agenda';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL!;

const agenda = new Agenda({
  db: { address: MONGO_URL },
  maxConcurrency: 1,
  defaultLockLifetime: 10 * 60 * 1000 // 10 minutes
});

export default agenda; 