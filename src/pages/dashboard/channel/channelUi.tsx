/* eslint-disable react-refresh/only-export-components */

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

export function formatMetric(value: number, locale: string) {
  return new Intl.NumberFormat(resolveLocale(locale)).format(value || 0);
}

export function formatDate(value: string | undefined, locale: string, fallback = '--') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(resolveLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercentFromBps(value: number) {
  return `${((value || 0) / 100).toFixed(2)}%`;
}

export function parseStructuredText(value: string | undefined): Array<{ key: string; value: string }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed).map(([key, entry]) => ({
      key,
      value: stringifyValue(entry),
    }));
  } catch {
    return value ? [{ key: 'raw', value }] : [];
  }
}

export function getChannelStatusLabel(tDash: (key: string) => string, status: string) {
  const map: Record<string, string> = {
    active: 'dash.channel.status.active',
    pending: 'dash.channel.status.pending',
    earned: 'dash.channel.status.earned',
    settlement_in_progress: 'dash.channel.status.settlementInProgress',
    settled: 'dash.channel.status.settled',
    reversed: 'dash.channel.status.reversed',
    void: 'dash.channel.status.void',
    confirmed: 'dash.channel.status.confirmed',
    processing: 'dash.channel.status.processing',
    closed: 'dash.channel.status.closed',
    canceled: 'dash.channel.status.canceled',
  };
  return tDash(map[status] || 'dash.channel.status.unknown');
}

export function getChannelStatusTone(status: string) {
  switch (status) {
    case 'active':
    case 'earned':
    case 'settled':
    case 'closed':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
    case 'pending':
    case 'confirmed':
    case 'processing':
    case 'settlement_in_progress':
      return 'border-primary-400/20 bg-primary-400/10 text-orange-100';
    case 'reversed':
    case 'void':
    case 'canceled':
      return 'border-rose-400/20 bg-rose-400/10 text-rose-200';
    default:
      return 'border-white/10 bg-white/6 text-white/70';
  }
}

export function getRiskTone(level: string) {
  switch (level) {
    case 'low':
      return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100';
    case 'medium':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-100';
    case 'high':
      return 'border-rose-400/20 bg-rose-400/10 text-rose-100';
    default:
      return 'border-white/10 bg-white/6 text-white/70';
  }
}

export function ChannelMetricCard({
  label,
  value,
  hint,
  accentClass,
}: {
  label: string;
  value: string;
  hint: string;
  accentClass: string;
}) {
  return (
    <div className="dashboard-surface interactive-panel overflow-hidden rounded-[26px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClass}`}>
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="dashboard-kicker">{label}</span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="dashboard-copy mt-2 text-sm leading-6">{hint}</p>
    </div>
  );
}

export function ChannelEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="dashboard-surface rounded-[28px] border border-dashed border-white/10 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/6 text-white/70">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
      <p className="dashboard-copy mx-auto mt-3 max-w-2xl text-sm leading-7">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ChannelDetailPanel({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <aside className="dashboard-surface sticky top-24 rounded-[28px] p-5">
      <p className="dashboard-kicker text-primary-300/75">{kicker}</p>
      <h3 className="mt-3 text-2xl font-black text-white">{title}</h3>
      <p className="dashboard-copy mt-2 text-sm leading-6">{description}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </aside>
  );
}

export function ChannelDataRow({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${accent ? 'border-primary-400/20 bg-primary-400/8' : 'border-white/8 bg-black/20'}`}>
      <span className="text-sm text-white/48">{label}</span>
      <span className={`text-right text-sm font-semibold text-white ${mono ? 'font-mono text-xs sm:text-sm' : ''}`}>{value}</span>
    </div>
  );
}

function resolveLocale(locale: string) {
  if (locale === 'zh') return 'zh-CN';
  if (locale === 'th') return 'th-TH';
  return 'en-US';
}

function stringifyValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '--';
  return JSON.stringify(value);
}
