// compyle — Money screen (Savings + Payments)
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Progress } from '../components/ui/shared';
import { formatPHP } from '../lib/seed';
import type { UserData, ViewMode, BankAccount, Transaction, Bill, Debt, EditingState } from '../types';

interface MoneyProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  onProfile: () => void;
  onEdit: (e: EditingState) => void;
  onMarkPaid: (id: string) => void;
  onPayDebt: (id: string) => void;
}

export function MoneyScreen({ data, viewMode, isPartner, onProfile, onEdit, onMarkPaid, onPayDebt }: MoneyProps) {
  const [tab, setTab] = useState<'savings' | 'payments'>('savings');
  const [hidden, setHidden] = useState(true);

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Money</div>
          <h1>{tab === 'savings' ? 'Spent & ' : 'Bills & '}<em>{tab === 'savings' ? 'saved' : 'owed'}</em></h1>
        </div>
        <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
          {viewMode === 'partner' ? 'L' : 'y'}
          <span className="dot" />
        </button>
      </div>

      <div className="pad-x" style={{ marginTop: 4, marginBottom: 16 }}>
        <div className="segment">
          {([{ id: 'savings', label: 'Savings' }, { id: 'payments', label: 'Payments' }] as const).map((s) => (
            <button key={s.id} className={tab === s.id ? 'active' : ''} onClick={() => setTab(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {tab === 'savings' && (
        <SavingsPanel data={data} hidden={hidden} setHidden={setHidden} isPartner={isPartner} onEdit={onEdit} />
      )}
      {tab === 'payments' && (
        <PaymentsPanel data={data} isPartner={isPartner} onEdit={onEdit} onMarkPaid={onMarkPaid} onPayDebt={onPayDebt} />
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

function computeFlow(transactions: Transaction[]) {
  const now = new Date();
  const tm = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inSum = tm.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const outSum = tm.filter((t) => t.amt < 0).reduce((a, t) => a + Math.abs(t.amt), 0);
  return { in: inSum, out: outSum, net: inSum - outSum };
}

function SavingsPanel({ data, hidden, setHidden, isPartner, onEdit }: {
  data: UserData; hidden: boolean; setHidden: (v: boolean) => void;
  isPartner: boolean; onEdit: (e: EditingState) => void;
}) {
  const total = data.banks.reduce((a, b) => a + b.balance, 0);
  const flow = computeFlow(data.transactions);
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const allCats = data.banks.flatMap((b: BankAccount) =>
    (b.categories ?? []).map((c) => ({ ...c, bankId: b.id, bankName: b.name, bankColor: b.color }))
  );

  return (
    <>
      {/* total balance */}
      <div className="pad-x">
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="row-between">
            <div className="label">Total balance</div>
            <button onClick={() => setHidden(!hidden)} style={{ padding: 4, color: 'var(--ink-soft)' }}>
              {hidden ? Icons.eye() : Icons.eyeOff()}
            </button>
          </div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 52, lineHeight: 1, marginTop: 8 }}>
            {formatPHP(total, { cents: true })}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--moss)', marginTop: 8, letterSpacing: '0.05em' }}>
            ↑ {formatPHP(flow.net, { short: true })} net this month
          </div>
        </div>
      </div>

      {/* accounts */}
      <div style={{ marginTop: 22 }}>
        <div className="pad-x label" style={{ marginBottom: 10 }}>Accounts</div>
        <div className="scrollx">
          {data.banks.map((b: BankAccount) => (
            <div key={b.id}
              onClick={() => !isPartner && onEdit({ type: 'account', item: b })}
              style={{
                flexShrink: 0, width: 200, padding: '14px 16px',
                borderRadius: 16, background: 'var(--white)', border: '1px solid var(--hair)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 100, cursor: isPartner ? 'default' : 'pointer',
              }}>
              <div className="row">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{b.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em' }}>•••{b.last4}</div>
                </div>
              </div>
              <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 22, marginTop: 12 }}>
                {formatPHP(b.balance, { cents: true })}
              </div>
            </div>
          ))}
          {!isPartner && (
            <button onClick={() => onEdit({ type: 'account' })} style={{
              flexShrink: 0, width: 100, minHeight: 100,
              borderRadius: 16, border: '1px dashed var(--hair-strong)',
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4, color: 'var(--ink-mute)',
            }}>
              <span style={{ fontSize: 22 }}>+</span>
              <span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Account</span>
            </button>
          )}
          <div style={{ flexShrink: 0, width: 10 }} />
        </div>
      </div>

      {/* cash flow */}
      <div style={{ marginTop: 22 }}>
        <div className="pad-x label" style={{ marginBottom: 10 }}>Cash flow · {monthName}</div>
        <div className="pad-x">
          <div className="card white" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'In', val: flow.in, color: 'var(--moss)' },
                { label: 'Out', val: flow.out, color: 'var(--clay)' },
                { label: 'Net', val: flow.net, color: 'var(--ink)' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</div>
                  <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 20, color }}>{formatPHP(val, { short: true })}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', height: 6, marginTop: 14, borderRadius: 999, overflow: 'hidden', background: 'var(--cream-deep)' }}>
              <div style={{ width: `${flow.in / ((flow.in + flow.out) || 1) * 100}%`, background: 'var(--moss)' }} />
              <div style={{ width: `${flow.out / ((flow.in + flow.out) || 1) * 100}%`, background: 'var(--clay)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* categories */}
      <div style={{ marginTop: 24 }}>
        <div className="pad-x row-between" style={{ marginBottom: 10 }}>
          <div className="label">Categories</div>
          {!isPartner && (
            <button onClick={() => onEdit({ type: 'category' })} className="mono" style={{
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
              padding: '4px 10px', borderRadius: 999, color: 'var(--ink)', border: '1px solid var(--hair-strong)',
            }}>+ Add</button>
          )}
        </div>
        <div className="pad-x" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.banks.map((b: BankAccount) => {
            const cats = b.categories ?? [];
            if (!cats.length && isPartner) return null;
            return (
              <div key={b.id} className="card white" style={{ padding: '14px 18px' }}>
                <div className="row" style={{ gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <span className="dot" style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>{b.name}</span>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-mute)' }}>· {cats.length} categories</span>
                </div>
                {cats.map((c) => (
                  <div key={c.id}
                    onClick={() => !isPartner && onEdit({ type: 'category', item: { ...c, bankId: b.id } })}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--hair)', cursor: isPartner ? 'default' : 'pointer' }}>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="dot" style={{ background: c.color }} />
                      <span style={{ fontSize: 14 }}>{c.name}</span>
                    </div>
                    <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 18 }}>
                      {formatPHP(c.balance, { short: true })}
                    </div>
                  </div>
                ))}
                {cats.length === 0 && (
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-mute)', padding: '10px 0', borderTop: '1px solid var(--hair)' }}>
                    NO CATEGORIES YET
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* recent transactions */}
      <div style={{ marginTop: 24 }}>
        <div className="pad-x label" style={{ marginBottom: 10 }}>Recent activity</div>
        <div className="pad-x">
          <div className="card white" style={{ padding: '4px 18px' }}>
            {data.transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                No activity yet
              </div>
            )}
            {data.transactions.slice(0, 6).map((tx: Transaction) => {
              const cat = allCats.find((c) => c.id === tx.cat);
              const isAdd = tx.amt > 0;
              return (
                <div key={tx.id} className="row"
                  onClick={() => !isPartner && onEdit({ type: 'tx', item: tx })}
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--hair)', gap: 12, cursor: isPartner ? 'default' : 'pointer' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0, position: 'relative',
                    background: cat ? cat.color : 'var(--moss)', opacity: 0.15,
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: cat ? cat.color : 'var(--moss)',
                      fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, opacity: 1 / 0.15,
                    }}>{isAdd ? '+' : '−'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.label}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
                      {cat ? cat.name.toUpperCase() : 'INCOME'} · {tx.time}
                    </div>
                  </div>
                  <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 18, color: isAdd ? 'var(--moss)' : 'var(--ink)' }}>
                    {formatPHP(tx.amt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function PaymentsPanel({ data, isPartner, onEdit, onMarkPaid, onPayDebt }: {
  data: UserData; isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onMarkPaid: (id: string) => void;
  onPayDebt: (id: string) => void;
}) {
  const billsDue = data.bills.filter((b) => b.status === 'due');
  const billsPaid = data.bills.filter((b) => b.status === 'paid');
  const totalDue = billsDue.reduce((a, b) => a + b.amount, 0);
  const now = new Date();

  return (
    <>
      {/* summary */}
      <div className="pad-x">
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="row-between">
            <div className="label">Due this month</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '0.1em' }}>
              {billsDue.length} bills
            </div>
          </div>
          <div className="amount" style={{ fontSize: 52, lineHeight: 1, marginTop: 8 }}>
            {formatPHP(totalDue)}
          </div>
          <div className="row" style={{ marginTop: 14, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Progress value={billsPaid.length} max={data.bills.length} variant="moss" />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--moss)' }}>
              {billsPaid.length}/{data.bills.length} paid
            </div>
          </div>
        </div>
      </div>

      {/* recurring bills */}
      <div style={{ marginTop: 22 }}>
        <div className="pad-x row-between" style={{ marginBottom: 10 }}>
          <div className="label">Recurring bills</div>
          {!isPartner && (
            <button onClick={() => onEdit({ type: 'bill' })} className="mono" style={{
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
              padding: '4px 10px', borderRadius: 999, color: 'var(--ink)', border: '1px solid var(--hair-strong)',
            }}>+ Bill</button>
          )}
        </div>
        <div className="pad-x">
          <div className="card white" style={{ padding: '4px 18px' }}>
            {data.bills.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                No bills added yet
              </div>
            )}
            {data.bills.map((b: Bill) => {
              const cls = b.status === 'paid' ? 'paid' : b.status === 'overdue' ? 'overdue' : 'due';
              return (
                <div key={b.id} className="row" style={{ padding: '13px 0', borderBottom: '1px solid var(--hair)', gap: 12 }}>
                  <button
                    className={`mark-paid-btn${b.status === 'paid' ? ' checked' : ''}`}
                    disabled={isPartner}
                    onClick={(e) => { e.stopPropagation(); !isPartner && onMarkPaid(b.id); }}
                  >
                    {Icons.check({ size: 12 })}
                  </button>
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: isPartner ? 'default' : 'pointer' }}
                    onClick={() => !isPartner && onEdit({ type: 'bill', item: b })}
                  >
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 15, color: 'var(--ink)' }}>{b.name}</span>
                      <span className={`ribbon ${cls}`}>
                        {b.status === 'paid' ? '✓ Paid' : `Due ${now.toLocaleString('en-US', { month: 'short' })} ${b.due}`}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 4 }}>
                      MONTHLY · Day {b.due}
                    </div>
                  </div>
                  <div className="amount" style={{ fontSize: 20, opacity: b.status === 'paid' ? 0.5 : 1 }}>
                    {formatPHP(b.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* debts */}
      {(data.debts.length > 0 || !isPartner) && (
        <div style={{ marginTop: 24 }}>
          <div className="pad-x row-between" style={{ marginBottom: 10 }}>
            <div className="label">Owed & installments</div>
            {!isPartner && (
              <button onClick={() => onEdit({ type: 'debt' })} className="mono" style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                padding: '4px 10px', borderRadius: 999, color: 'var(--ink)', border: '1px solid var(--hair-strong)',
              }}>+ Debt</button>
            )}
          </div>
          <div className="pad-x" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.debts.map((d: Debt) => {
              const pct = (d.paid / d.total) * 100;
              const remaining = d.total - d.paid;
              const dueDate = new Date(d.due);
              const daysLeft = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const overdue = daysLeft < 0;
              return (
                <div key={d.id} className="card white" style={{ padding: '14px 18px', cursor: isPartner ? 'default' : 'pointer' }}
                  onClick={() => !isPartner && onEdit({ type: 'debt', item: d })}>
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--ink)' }}>{d.name}</div>
                      <div className="mono" style={{ fontSize: 10, color: overdue ? 'var(--clay)' : 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 3 }}>
                        {d.months > 0 ? `${d.paidMonths}/${d.months} payments · ` : ''}
                        {overdue ? `${Math.abs(daysLeft)} DAYS OVERDUE` : `${daysLeft} DAYS LEFT`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="amount" style={{ fontSize: 20 }}>{formatPHP(remaining)}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>of {formatPHP(d.total)}</div>
                    </div>
                  </div>
                  <div className="progress" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div style={{ width: `${pct}%`, background: overdue ? 'var(--clay)' : 'var(--ink)' }} />
                  </div>
                  <div className="row-between" style={{ marginTop: 6 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.08em' }}>
                      {pct.toFixed(0)}% PAID
                    </div>
                    {!isPartner && d.months > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPayDebt(d.id); }}
                        className="mono"
                        style={{
                          fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '4px 10px', borderRadius: 999, background: 'var(--ink)',
                          color: 'var(--cream)', fontWeight: 600,
                        }}
                      >
                        Pay installment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
