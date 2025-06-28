import { metrics } from '@opentelemetry/api';
import process from 'process';

const meter = metrics.getMeter('process-metrics');

/* ------- RSS Gauge -------- */
meter.createObservableGauge('worker_rss_bytes', {
  description: 'Resident set size',
}).addCallback(res =>
  res.observe(process.memoryUsage().rss)
);

/* ------- CPU % Gauge ------- */
let lastCPU = process.cpuUsage();
let lastHr  = process.hrtime();

meter.createObservableGauge('worker_cpu_percent', {
  description: 'CPU % averaged over 1 s',
}).addCallback(res => {
  const nowCPU = process.cpuUsage();
  const nowHr  = process.hrtime();

  const user   = nowCPU.user   - lastCPU.user;
  const system = nowCPU.system - lastCPU.system;
  const ns     = (nowHr[0] - lastHr[0]) * 1e9 + (nowHr[1] - lastHr[1]);

  const pct = (user + system) / ns * 100;   // one core = 100 %
  res.observe(pct);

  lastCPU = nowCPU;
  lastHr  = nowHr;
});
