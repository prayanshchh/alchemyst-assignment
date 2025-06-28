// src/utils/runInSpan.ts
import { trace, context } from '@opentelemetry/api';
import { jobSuccess, jobFailure, jobDuration, jobInProgress } from './metrics';

export async function runInSpan<T>(name: string, attrs: any, fn: () => Promise<T>) {
    const tracer = trace.getTracer('agenda');
    const jobName  = name.replace(/^agenda[._]/, '');

    const span   = tracer.startSpan(name, { attributes: attrs });
    span.setAttribute('exported_job', jobName);

    jobInProgress.add(1, { exported_job: jobName });
    const start = Date.now();
  
    try {
      const result = await context.with(trace.setSpan(context.active(), span), fn);
      jobSuccess.add(1, { exported_job: jobName });
      return result;
    } catch (err) {
      jobFailure.add(1, { exported_job: jobName });
      span.recordException(err as Error);
      throw err;
    } finally {
      const ms = Date.now() - start;
      jobDuration.record(ms, { exported_job: jobName });
      jobInProgress.add(-1, { exported_job: jobName });
      span.end();
    }
  }
  
