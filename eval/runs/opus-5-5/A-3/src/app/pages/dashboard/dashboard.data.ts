import { BadgeTone } from '../../shared/badge.component';

export interface MetricTile {
  title: string;
  value: string;
  trend?: { label: string; tone: BadgeTone };
  subLabel?: string;
}

export interface ThroughputPoint {
  day: string;
  requests: number;
}

export interface ServiceStatus {
  name: string;
  online: boolean;
}

export interface SummaryItem {
  label: string;
  value: string;
}

export type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR';

export interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

export const METRICS: MetricTile[] = [
  { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'positive' }, subLabel: 'vs last 7 days' },
  { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'positive' }, subLabel: 'vs last 7 days' },
  { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'negative' }, subLabel: 'vs last 7 days' },
  { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'positive' }, subLabel: 'last 30 days' },
];

export const THROUGHPUT: ThroughputPoint[] = [
  { day: 'Mon', requests: 4120 },
  { day: 'Tue', requests: 4680 },
  { day: 'Wed', requests: 5210 },
  { day: 'Thu', requests: 4950 },
  { day: 'Fri', requests: 5630 },
  { day: 'Sat', requests: 3240 },
  { day: 'Sun', requests: 2890 },
];

export const SERVICES: ServiceStatus[] = [
  { name: 'API Gateway', online: true },
  { name: 'Auth Service', online: true },
  { name: 'Storage Service', online: true },
  { name: 'Analytics Engine', online: false },
  { name: 'Cache Layer', online: true },
];

export const SUMMARY: SummaryItem[] = [
  { label: 'Requests/min', value: '4,820' },
  { label: 'Avg Response', value: '142 ms' },
  { label: 'Error Rate', value: '0.04%' },
  { label: 'Uptime (30d)', value: '99.97%' },
];

export const LOG_TEMPLATES: ReadonlyArray<{ level: LogLevel; message: string }> = [
  { level: 'INFO', message: 'GET /api/users 200 — 38ms' },
  { level: 'OK', message: 'Health check passed: api-gateway' },
  { level: 'INFO', message: 'POST /api/auth/token 201 — 112ms' },
  { level: 'WARN', message: 'Cache miss ratio above 20% on cache-layer' },
  { level: 'INFO', message: 'Worker pool scaled to 6 instances' },
  { level: 'ERROR', message: 'analytics-engine: connection refused (10.0.4.12:9000)' },
  { level: 'OK', message: 'Backup snapshot completed in 4.2s' },
  { level: 'INFO', message: 'PUT /api/users/3 200 — 64ms' },
  { level: 'WARN', message: 'Slow query detected: 420ms (threshold 300ms)' },
  { level: 'OK', message: 'TLS certificate renewed for api.blueprint.dev' },
];
