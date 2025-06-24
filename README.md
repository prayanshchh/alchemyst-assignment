# Deep-Research Agent Demo

Event-driven research agent demo using Node.js, Express, RabbitMQ, AgendaJS, and MongoDB. Designed for asynchronous, long-running research tasks, ready for Google Cloud Run deployment.

## Stack
- Node.js (ESM)
- Express
- RabbitMQ
- AgendaJS
- MongoDB

## Features
- Enqueue deep research requests via API
- Asynchronous processing with RabbitMQ and Agenda
- Modular micro-job steps

## Setup
1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start services:
   - Express API: `npm start`
   - Worker: `npm run worker`

## API
- `POST /research` — Enqueue a research job
- `GET /status/:jobId` — Check job status

## Deployment
Ready for Google Cloud Run. See `Dockerfile` for containerization. 