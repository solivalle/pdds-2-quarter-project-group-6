import { env } from '../config/env';
import { TicketPriority } from './enums';
import { SlaSnapshot } from './types';

export const STANDARD_SLA_POLICY: Record<TicketPriority, { responseMinutes: number; resolutionMinutes: number }> = {
  P0: { responseMinutes: 120, resolutionMinutes: 240 },
  P1: { responseMinutes: 240, resolutionMinutes: 480 },
  P2: { responseMinutes: 480, resolutionMinutes: 1440 },
  P3: { responseMinutes: 1440, resolutionMinutes: 4320 },
  P4: { responseMinutes: 4320, resolutionMinutes: 7200 }
};

export const DEMO_SLA_POLICY: Record<TicketPriority, { responseMinutes: number; resolutionMinutes: number }> = {
  P0: { responseMinutes: 1, resolutionMinutes: 2 },
  P1: { responseMinutes: 2, resolutionMinutes: 4 },
  P2: { responseMinutes: 3, resolutionMinutes: 6 },
  P3: { responseMinutes: 4, resolutionMinutes: 8 },
  P4: { responseMinutes: 5, resolutionMinutes: 10 }
};

export function currentSlaPolicy(): Record<TicketPriority, { responseMinutes: number; resolutionMinutes: number }> {
  return env.SLA_POLICY_PRESET === 'demo' ? DEMO_SLA_POLICY : STANDARD_SLA_POLICY;
}

function parseTime(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.split(':');
  return { hour: Number(hourRaw), minute: Number(minuteRaw) };
}

function setTime(date: Date, value: string): Date {
  const { hour, minute } = parseTime(value);
  const copy = new Date(date);
  copy.setHours(hour, minute, 0, 0);
  return copy;
}

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function nextBusinessStart(date: Date): Date {
  let next = setTime(date, env.BUSINESS_HOURS_START);
  if (date >= setTime(date, env.BUSINESS_HOURS_END)) {
    next.setDate(next.getDate() + 1);
  }
  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return setTime(next, env.BUSINESS_HOURS_START);
}

export function addBusinessMinutes(start: Date, minutes: number): Date {
  let cursor = new Date(start);
  let remaining = minutes;

  while (remaining > 0) {
    if (!isBusinessDay(cursor) || cursor < setTime(cursor, env.BUSINESS_HOURS_START) || cursor >= setTime(cursor, env.BUSINESS_HOURS_END)) {
      cursor = nextBusinessStart(cursor);
    }

    const dayEnd = setTime(cursor, env.BUSINESS_HOURS_END);
    const availableMinutes = Math.max(0, Math.floor((dayEnd.getTime() - cursor.getTime()) / 60000));
    const consumed = Math.min(remaining, availableMinutes);
    cursor = new Date(cursor.getTime() + consumed * 60000);
    remaining -= consumed;

    if (remaining > 0) {
      cursor = nextBusinessStart(new Date(dayEnd.getTime() + 60000));
    }
  }

  return cursor;
}

export function calculateSla(priority: TicketPriority, createdAt: Date): SlaSnapshot {
  const policy = currentSlaPolicy()[priority];
  const responseDueAt = addBusinessMinutes(createdAt, policy.responseMinutes);
  const resolutionDueAt = addBusinessMinutes(createdAt, policy.resolutionMinutes);
  return {
    responseDueAt: responseDueAt.toISOString(),
    resolutionDueAt: resolutionDueAt.toISOString(),
    responseMinutes: policy.responseMinutes,
    resolutionMinutes: policy.resolutionMinutes,
    isAtRisk: false,
    isBreached: false
  };
}

export function evaluateSla(snapshot: SlaSnapshot, createdAt: string, now = new Date()): SlaSnapshot {
  const created = new Date(createdAt).getTime();
  const due = new Date(snapshot.resolutionDueAt).getTime();
  const total = Math.max(1, due - created);
  const resolvedAt = snapshot.resolvedAt ? new Date(snapshot.resolvedAt).getTime() : undefined;
  const effectiveNow = resolvedAt ?? now.getTime();
  const consumed = effectiveNow - created;
  const isResolved = resolvedAt !== undefined;

  return {
    ...snapshot,
    isAtRisk: consumed / total >= 0.75 && !isResolved,
    isBreached: effectiveNow > due
  };
}
