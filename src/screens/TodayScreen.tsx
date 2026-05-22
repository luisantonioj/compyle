// compyle — Today screen
import React from 'react';
import { Icons } from '../components/Icons';
import { Progress } from '../components/ui/shared';
import { formatPHP, TODAY_KEY } from '../lib/seed';
import type { UserData, ViewMode, Task, Bill, EditingState } from '../types';

interface TodayProps {
  data: UserData;
  viewMode: ViewMode;
  partnerName: string;
  isPartner: boolean;
  onProfile: () => void;
  onCheck: (id: string, dateKey?: string) => void;
  onEdit: (e: EditingState) => void;
  showLoveNote?: boolean;
}

export function TodayScreen({ data, viewMode, partnerName, isPartner, onProfile, onCheck, onEdit, showLoveNote = true }: TodayProps) {
  const today = data.tasks[TODAY_KEY] ?? [];
  const habitsDone = data.habits.filter((h) => h.doneToday).length;
  const tasksDone = today.filter((t) => t.done).length;
  const dueBill = data.bills.find((b) => b.status === 'due');
  const now = new Date();
  const totalBalance = data.banks.reduce((a, b) => a + b.balance, 0);
  const tm = data.transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const flowIn = tm.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const flowOut = tm.filter((t) => t.amt < 0).reduce((a, t) => a + Math.abs(t.amt), 0);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 5) return 'Still up';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Late night';
  })();

  const name = isPartner ? partnerName : 'yle';
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="screen fade-in">
      {/* top bar */}
      <div className="top-bar">
        <div>
          <div className="kicker">{greeting}</div>
          <h1>{name}<em>.</em></h1>
        </div>
        <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
          {viewMode === 'partner' ? 'L' : 'y'}
          <span className="dot" />
        </button>
      </div>

      {/* hero date */}
      <div className="pad-x" style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--hair)' }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>{dayName}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 52, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
              {now.toLocaleDateString('en-US', { month: 'long' })} <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>{now.getDate()}</em>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ marginBottom: 4 }}>Week {getWeekNumber(now)}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{String(getWeekNumber(now)).padStart(2, '0')} of 52</div>
          </div>
        </div>
      </div>

      {/* glance grid */}
      <div className="pad-x" style={{ marginTop: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="card white" style={{ padding: '14px 16px' }}>
            <div className="label">Today's tasks</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
              <span className="amount" style={{ fontSize: 32 }}>{tasksDone}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>of {today.length}</span>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={tasksDone} max={today.length || 1}/></div>
          </div>
          <div className="card white" style={{ padding: '14px 16px' }}>
            <div className="label">Habits</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
              <span className="amount" style={{ fontSize: 32 }}>{habitsDone}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>of {data.habits.length}</span>
            </div>
            <div style={{ marginTop: 10 }}><Progress value={habitsDone} max={data.habits.length} variant="clay"/></div>
          </div>
        </div>
      </div>

      {/* money snapshot */}
      <div className="pad-x" style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="row-between">
            <div className="label">Across {data.banks.length} accounts</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.1em' }}>
              NET · {formatPHP(flowIn - flowOut, { short: true })}
            </div>
          </div>
          <div className="amount" style={{ fontSize: 40, lineHeight: 1.1, marginTop: 4 }}>
            {formatPHP(totalBalance, { cents: true })}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)', marginBottom: 6 }}>
              <span style={{ color: 'var(--moss)' }}>↑ {formatPHP(flowIn, { short: true })} in</span>
              <span style={{ color: 'var(--clay)' }}>↓ {formatPHP(flowOut, { short: true })} out</span>
            </div>
            <div style={{ display: 'flex', height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
              <div style={{ width: `${flowIn / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--moss)' }}/>
              <div style={{ width: `${flowOut / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--clay)' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* up next */}
      <div className="pad-x" style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>Up next</div>
        </div>
        <div className="card white" style={{ padding: '4px 16px' }}>
          {today.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
              Nothing planned. Quiet day.
            </div>
          )}
          {today.slice(0, 4).map((t: Task, i: number) => (
            <div key={t.id}
              className={`task-item${!isPartner ? ' row-tap' : ''}`}
              style={{ borderBottom: i < Math.min(today.length, 4) - 1 ? '1px solid var(--hair)' : 'none' }}
              onClick={(e) => {
                if (isPartner) return;
                if ((e.target as HTMLElement).closest('.check')) return;
                onEdit({ type: 'task', item: t, dateKey: TODAY_KEY });
              }}
            >
              <button className={`check${t.done ? ' checked' : ''}`} disabled={isPartner}
                onClick={(e) => { e.stopPropagation(); !isPartner && onCheck(t.id); }}>
                {Icons.check()}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: t.done ? 'var(--ink-mute)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>
                  <span style={{ marginRight: 6 }}>{t.emoji}</span>{t.title}
                </div>
                {t.time && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 3 }}>{t.time}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* upcoming bill */}
      {dueBill && (
        <div className="pad-x" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>Coming up</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--amber)' }}>
              due day {(dueBill as Bill).due}
            </div>
          </div>
          <div className="card white" style={{ padding: '16px 18px', borderColor: 'rgba(192,136,56,0.3)', cursor: isPartner ? 'default' : 'pointer' }}
            onClick={() => !isPartner && onEdit({ type: 'bill', item: dueBill })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="label" style={{ color: 'var(--amber)' }}>Bill due · {now.toLocaleString('en-US', { month: 'short' })} {(dueBill as Bill).due}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 24, marginTop: 4 }}>{(dueBill as Bill).name}</div>
              </div>
              <div className="amount" style={{ fontSize: 28 }}>{formatPHP((dueBill as Bill).amount)}</div>
            </div>
          </div>
        </div>
      )}

      {/* love note */}
      {!isPartner && showLoveNote && (
        <div className="pad-x" style={{ marginTop: 28, marginBottom: 16 }}>
          <div style={{ border: '1px dashed rgba(176,74,47,0.3)', borderRadius: 16, padding: '16px 18px', background: 'rgba(243,220,207,0.3)' }}>
            <div className="label" style={{ color: 'var(--clay)', marginBottom: 4 }}>From Luis</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, color: 'var(--ink)' }}>
              "I miss you."
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
