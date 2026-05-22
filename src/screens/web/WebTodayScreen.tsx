import React from 'react';
import { Icons } from '../../components/Icons';
import { formatPHP, TODAY_KEY, TODAY } from '../../lib/seed';
import type { UserData, ViewMode, EditingState } from '../../types';

interface WebTodayProps {
  data: UserData;
  isPartner: boolean;
  viewMode: ViewMode;
  onEdit: (e: EditingState) => void;
  onCheckTask: (id: string, dateKey?: string) => void;
  onCheckHabit: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  showLoveNote?: boolean;
}

export function WebTodayScreen({
  data, isPartner, onEdit, onCheckTask, onCheckHabit, showLoveNote = true,
}: WebTodayProps) {
  const tasks = data.tasks[TODAY_KEY] ?? [];
  const tasksDone = tasks.filter((t) => t.done).length;
  const habitsDone = data.habits.filter((h) => h.doneToday).length;
  const totalBalance = data.banks.reduce((a, b) => a + b.balance, 0);
  const tm = data.transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === TODAY.getMonth() && d.getFullYear() === TODAY.getFullYear();
  });
  const flowIn = tm.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const flowOut = tm.filter((t) => t.amt < 0).reduce((a, t) => a + Math.abs(t.amt), 0);
  const dueBills = data.bills.filter((b) => b.status === 'due');
  const dueAmount = dueBills.reduce((a, b) => a + b.amount, 0);

  const name = isPartner ? 'Luis' : 'yle';
  const h = TODAY.getHours();
  const greeting =
    h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Late night';
  const dayStr = TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const startOfYear = new Date(TODAY.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((TODAY.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">{greeting} · {dayStr}</div>
          <h1>{name}<em>.</em></h1>
        </div>
        <div className="ph-right">
          <div className="kicker">Week</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1, marginTop: 6 }}>
            <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{weekNum}</em>{' '}of 52
          </div>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric">
          <div className="label">Today's tasks</div>
          <div className="value">
            {tasksDone}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>/{tasks.length}</span>
          </div>
          <div className="progress" style={{ marginTop: 10 }}>
            <div style={{ width: tasks.length ? `${(tasksDone / tasks.length) * 100}%` : '0%' }} />
          </div>
        </div>
        <div className="metric">
          <div className="label">Habits done</div>
          <div className="value">
            {habitsDone}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>/{data.habits.length}</span>
          </div>
          <div className="progress clay" style={{ marginTop: 10 }}>
            <div style={{ width: `${(habitsDone / (data.habits.length || 1)) * 100}%` }} />
          </div>
        </div>
        <div className="metric">
          <div className="label">Total balance</div>
          <div className="value">{formatPHP(totalBalance, { short: true })}</div>
          <div className="delta">across {data.banks.length} accounts</div>
        </div>
        <div className="metric">
          <div className="label">Bills due</div>
          <div className="value">{formatPHP(dueAmount, { short: true })}</div>
          <div className={`delta${dueBills.length > 0 ? ' neg' : ''}`}>{dueBills.length} bills pending</div>
        </div>
      </div>

      <div className="today-grid">
        {/* tasks */}
        <div className="card white">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.01em' }}>Up next</div>
            <div className="label">{tasks.length} tasks</div>
          </div>
          <div>
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`task-list-item${t.done ? ' done' : ''}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.check')) return;
                  if (!isPartner) onEdit({ type: 'task', item: t, dateKey: TODAY_KEY });
                }}
              >
                <button
                  className={`check${t.done ? ' checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); if (!isPartner) onCheckTask(t.id); }}
                >
                  {Icons.check()}
                </button>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.emoji}</span>
                <span className="title">{t.title}</span>
                {t.time && <span className="time">{t.time}</span>}
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                Nothing planned. Quiet day.
              </div>
            )}
            {!isPartner && (
              <button
                className="task-list-item"
                style={{ width: '100%', justifyContent: 'center', color: 'var(--ink-mute)', gap: 6, cursor: 'pointer', paddingTop: 14 }}
                onClick={() => onEdit({ type: 'task', dateKey: TODAY_KEY })}
              >
                {Icons.plus({ size: 14, stroke: 'currentColor' })}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Add task</span>
              </button>
            )}
          </div>
        </div>

        {/* habits / rituals */}
        <div className="card white">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.01em' }}>Rituals</div>
            <div className="label">{habitsDone}/{data.habits.length}</div>
          </div>
          <div>
            {data.habits.map((hab) => (
              <div key={hab.id} className="row" style={{ padding: '11px 0', borderBottom: '1px solid var(--hair)', gap: 12 }}>
                <button
                  className={`check${hab.doneToday ? ' checked' : ''}`}
                  onClick={() => !isPartner && onCheckHabit(hab.id)}
                  disabled={isPartner}
                >
                  {Icons.check()}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{hab.name}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>{hab.note}</div>
                </div>
                {hab.streak > 0 && (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--clay)', fontWeight: 600 }}>🔥 {hab.streak}d</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* money + bills + love note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card ink">
            <div className="label" style={{ color: 'rgba(244,239,228,0.6)' }}>Cash flow this month</div>
            <div className="amount" style={{ fontSize: 40, lineHeight: 1.05, marginTop: 8, color: 'var(--cream)' }}>
              {formatPHP(flowIn - flowOut, { cents: false })}
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(244,239,228,0.5)', marginTop: 6 }}>
              ↑ {formatPHP(flowIn, { short: true }).toUpperCase()} IN · ↓ {formatPHP(flowOut, { short: true }).toUpperCase()} OUT
            </div>
            <div style={{ display: 'flex', height: 6, marginTop: 14, borderRadius: 999, overflow: 'hidden', background: 'rgba(244,239,228,0.1)' }}>
              <div style={{ width: `${flowIn / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--moss-soft)' }} />
              <div style={{ width: `${flowOut / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--clay-soft)' }} />
            </div>
          </div>

          {dueBills[0] && (
            <div
              className="card white"
              style={{ borderColor: 'rgba(192,136,56,0.3)', cursor: isPartner ? 'default' : 'pointer' }}
              onClick={() => !isPartner && onEdit({ type: 'bill', item: dueBills[0] })}
            >
              <div className="label" style={{ color: 'var(--amber)', marginBottom: 6 }}>
                Bill due · day {dueBills[0].due}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, marginBottom: 4 }}>{dueBills[0].name}</div>
              <div className="amount" style={{ fontSize: 30 }}>{formatPHP(dueBills[0].amount)}</div>
            </div>
          )}

          {showLoveNote && !isPartner && (
            <div className="love-note">
              <div className="ln-label">From Luis</div>
              <div className="ln-body">"Five days till our anniversary. I made this for you. Open it daily."</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
