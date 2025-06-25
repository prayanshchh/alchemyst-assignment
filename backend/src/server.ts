import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Collection } from 'mongodb';
import mqPublisher from './queue';
import { getDb } from './mongodb';
import { startWorker } from './worker';
import agenda from './agenda';
//@ts-ignore
import Agendash from 'agendash';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

let jobs: Collection;

async function startServer() {
  try {
    const db = await getDb();
    jobs = db.collection('jobs');
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

startServer();
startWorker();

// POST /research
app.post('/research', async (req: Request, res: Response) => {
  const { topic } = req.body as { topic?: string };
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid topic' });
  }
  try {
    const job = { topic, status: 'queued', createdAt: new Date() };
    const result = await jobs.insertOne(job);
    const jobId = result.insertedId.toString();
    await mqPublisher.send({ jobId, topic });
    res.status(202).json({ jobId });
  } catch (err) {
    console.error('Error enqueuing research job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/dash', Agendash(agenda));

// GET /status/:jobId
app.get('/status/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    const db = await getDb();
    const [plan, gather, expand] = await Promise.all([
      db.collection('agendaJobs').findOne({ name: 'plan', 'data.jobId': jobId }),
      db.collection('agendaJobs').findOne({ name: 'gather', 'data.jobId': jobId }),
      db.collection('agendaJobs').findOne({ name: 'expand', 'data.jobId': jobId })
    ]);
    res.json({
      jobId,
      plan: plan || { status: 'not_started' },
      gather: gather || { status: 'not_started' },
      expand: expand || { status: 'not_started' }
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid jobId' });
  }
});

export default app;