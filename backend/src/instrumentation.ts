import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import process from 'process';


const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    'http://localhost:4318/v1/traces',
});

const metricReader = new PrometheusExporter(
  { port: 9464, endpoint: '/metrics' },
  () => console.log('[otel] metrics on :9464/metrics'),
);

/* ------- CPU % Gauge ------- */
let lastCPU = process.cpuUsage();
let lastHr  = process.hrtime();

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'deep-research-worker',
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // disable HTTP only if you really don’t want Express spans
      '@opentelemetry/instrumentation-http': { enabled: false },
    }),
  ],
});

sdk.start();