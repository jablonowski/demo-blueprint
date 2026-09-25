import { BadgeTone } from '../../shared/badge.component';

export interface Metric {
  title: string;
  value: string;
  trend?: { label: string; tone: BadgeTone };
  subLabel?: string;
}

export const METRICS: Metric[] = [
  { title: 'Active Users', value: '1,284', trend: { label: '+12%', tone: 'success' }, subLabel: 'vs last 7 days' },
  { title: 'Avg Response Time', value: '142ms', trend: { label: '-8ms', tone: 'success' }, subLabel: 'vs last 7 days' },
  { title: 'Error Rate', value: '0.04%', trend: { label: '+0.01%', tone: 'danger' }, subLabel: 'vs last 7 days' },
  { title: 'Uptime (30d)', value: '99.97%', trend: { label: 'Stable', tone: 'success' }, subLabel: 'last 30 days' },
];

export const THROUGHPUT: { day: string; requests: number }[] = [
  { day: 'Mon', requests: 3920 },
  { day: 'Tue', requests: 4480 },
  { day: 'Wed', requests: 5210 },
  { day: 'Thu', requests: 4830 },
  { day: 'Fri', requests: 5640 },
  { day: 'Sat', requests: 3350 },
  { day: 'Sun', requests: 2980 },
];

export const SERVICES: { name: string; online: boolean }[] = [
  { name: 'API Gateway', online: true },
  { name: 'Auth Service', online: true },
  { name: 'Storage Service', online: true },
  { name: 'Analytics Engine', online: false },
  { name: 'Cache Layer', online: true },
];

export const DATA_SUMMARY: { label: string; value: string }[] = [
  { label: 'Requests/min', value: '4,820' },
  { label: 'Avg Response', value: '142 ms' },
  { label: 'Error Rate', value: '0.04%' },
  { label: 'Uptime (30d)', value: '99.97%' },
];

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export const LOG_TEMPLATES: { level: LogLevel; source: string; message: string }[] = [
  { level: 'INFO', source: 'api-gateway', message: 'GET /api/users 200 in 38ms' },
  { level: 'INFO', source: 'auth-service', message: 'Token refreshed for session a3f92b1' },
  { level: 'DEBUG', source: 'cache-layer', message: 'Cache hit ratio 0.94 over last 60s' },
  { level: 'WARN', source: 'storage', message: 'Disk usage at 78% on volume /data' },
  { level: 'INFO', source: 'api-gateway', message: 'POST /api/users 201 in 52ms' },
  { level: 'ERROR', source: 'analytics', message: 'Connection refused: analytics-engine:9200' },
  { level: 'INFO', source: 'scheduler', message: 'Job nightly-rollup completed in 4.2s' },
  { level: 'WARN', source: 'api-gateway', message: 'Latency spike detected: 420 ms (threshold 300 ms)' },
  { level: 'DEBUG', source: 'auth-service', message: 'JWKS keys rotated, 2 active' },
  { level: 'INFO', source: 'storage', message: 'Snapshot snap-2291 uploaded (1.8 GB)' },
];
