import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('agenda-jobs');

export const jobSuccess  = meter.createCounter(
  'agenda_job_success_total',
  { description: 'Total successful Agenda jobs' },
);

export const jobFailure  = meter.createCounter(
  'agenda_job_failure_total',
  { description: 'Total failed Agenda jobs' },
);

export const jobDuration = meter.createHistogram(
  'agenda_job_duration_ms',
  { description: 'Agenda job duration in milliseconds' },
);

export const jobInProgress = meter.createUpDownCounter(
    'agenda_job_in_flight',
    { description: 'Current in-flight Agenda jobs' }
  );
