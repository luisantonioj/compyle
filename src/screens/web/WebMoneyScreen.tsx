import React, { useState } from 'react';
import { Icons } from '../../components/Icons';
import { formatPHP, TODAY } from '../../lib/seed';
import type { UserData, EditingState } from '../../types';

interface WebMoneyProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (e: EditingState) => void;
  onMarkPaid: (id: string) => void;
}

export function WebMoneyScreen({ data, isPartner, onEdit, onMarkPaid }: WebMoneyProps) {
  const [tab, setTab] = useState<'savings' | 'payments'>('savings');
  const [hidden, setHidden] = useState(true);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Money</div>
          <h1>{tab === 'savings' ? <>Spent & <em>saved</em></> : <>Bills & <em>owed</em></>}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-add ghost" onClick={() => setHidden(!hidden)}>
            {hidden ? Icons.eye() : Icons.eyeOff()}
            <span>{hidden ? 'Reveal' : 'Hide'}</span>
          </button>
          {!isPartner && (
            <button className="btn-add" onClick={() => onEdit({ type: tab === 'savings' ? 'tx' : 'bill' })}>
              {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
              <span>{tab === 'savings' ? 'Log entry' : 'Add bill'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="money-tabs">
        <button className={tab === 'savings' ? 'active' : ''} onClick={() => setTab('savings')}>
          Savings & Budget
        </button>
        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>
          Bills & Debts
        </button>
      </div>

      {tab === 'savings' && (
        <WebSavings data={data} hidden={hidden} isPartner={isPartner} onEdit={onEdit} />
      )}
      {tab === 'payments' && (
        <WebPayments data={data} isPartner={isPartner} onEdit={onEdit} onMarkPaid={onMarkPaid} />
      )}
    </div>
  );
}

function WebSavings({
  data, hidden, isPartner, onEdit,
}: {
  data: UserData; hidden: boolean; isPartner: boolean; onEdit: (e: EditingState) => void;
}) {
  const total = data.banks.reduce((a, b) => a + b.balance, 0);
  const tm = data.transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === TODAY.getMonth() && d.getFullYear() === TODAY.getFullYear();
  });
  const flowIn = tm.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const flowOut = tm.filter((t) => t.amt < 0).reduce((a, t) => a + Math.abs(t.amt), 0);
  const allCats = data.banks.flatMap((b) =>
    (b.categories ?? []).map((c) => ({ ...c, bankId: b.id, bankName: b.name, bankColor: b.color }))
  );

  return (
    <>
      {/* hero balance */}
      <div className="card ink" style={{ padding: '26px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="label" style={{ color: 'rgba(244,239,228,0.6)', marginBottom: 6 }}>
            Total across {data.banks.length} accounts
          </div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 72, lineHeight: 0.9, color: 'var(--cream)' }}>
            {formatPHP(total, { cents: true })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label" style={{ color: 'rgba(244,239,228,0.6)', marginBottom: 6 }}>Net this month</div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 36, color: 'var(--cream)' }}>
            {flowIn - flowOut >= 0 ? '+' : '−'}{formatPHP(Math.abs(flowIn - flowOut), { short: true })}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'rgba(244,239,228,0.5)', letterSpacing: '0.08em', marginTop: 4 }}>
            ↑ {formatPHP(flowIn, { short: true })} · ↓ {formatPHP(flowOut, { short: true })}
          </div>
        </div>
      </div>

      {/* accounts */}
      <div className="accounts-row">
        {data.banks.map((b) => (
          <div key={b.id} className="account-card" onClick={() => !isPartner && onEdit({ type: 'account', item: b })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13 }}>{b.name}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>•••{b.last4}</div>
              </div>
            </div>
            <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {formatPHP(b.balance, { cents: true })}
            </div>
          </div>
        ))}
        {!isPartner && (
          <button className="account-card add" onClick={() => onEdit({ type: 'account' })}>
            + Account
          </button>
        )}
      </div>

      {/* cash flow strip */}
      <div className="card white" style={{ padding: '20px 24px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 24, alignItems: 'center' }}>
        <div>
          <div className="label">Money in</div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 28, color: 'var(--moss)', marginTop: 4 }}>
            {formatPHP(flowIn, { short: true })}
          </div>
        </div>
        <div>
          <div className="label">Money out</div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 28, color: 'var(--clay)', marginTop: 4 }}>
            {formatPHP(flowOut, { short: true })}
          </div>
        </div>
        <div>
          <div className="label">Net</div>
          <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 28, marginTop: 4 }}>
            {formatPHP(flowIn - flowOut, { short: true })}
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Flow this month · {tm.length} entries</div>
          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
            <div style={{ width: `${flowIn / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--moss)' }} />
            <div style={{ width: `${flowOut / ((flowIn + flowOut) || 1) * 100}%`, background: 'var(--clay)' }} />
          </div>
        </div>
      </div>

      {/* categories | transactions */}
      <div className="money-cols">
        <div>
          <div className="col-head">
            <h3>Categories</h3>
            {!isPartner && (
              <button className="btn-add ghost" onClick={() => onEdit({ type: 'category' })}>
                {Icons.plus({ size: 14, stroke: 'currentColor' })} Category
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.banks.map((b) => {
              const cats = b.categories ?? [];
              const sum = cats.reduce((a, c) => a + (c.balance ?? 0), 0);
              return (
                <div key={b.id} className="cat-table">
                  <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--hair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
                    <div className="row" style={{ gap: 10 }}>
                      <span className="dot" style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />
                      <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{b.name}</span>
                    </div>
                    <div className={`mono blur${hidden ? '' : ' on'}`} style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>
                      {cats.length} cats · {formatPHP(sum, { short: true })}
                    </div>
                  </div>
                  {cats.map((c) => (
                    <div
                      key={c.id}
                      className="cat-row"
                      onClick={() => !isPartner && onEdit({ type: 'category', item: { ...c, bankId: b.id } })}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div className="row" style={{ gap: 10 }}>
                          <span className="dot" style={{ background: c.color }} />
                          <span style={{ fontSize: 14 }}>{c.name}</span>
                        </div>
                        <div className={`amount blur${hidden ? '' : ' on'}`} style={{ fontSize: 18, letterSpacing: '-0.02em' }}>
                          {formatPHP(c.balance, { short: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {cats.length === 0 && (
                    <div style={{ padding: '14px 18px', fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 14 }}>
                      No categories yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="col-head">
            <h3>Recent activity</h3>
            <div className="label">{data.transactions.length} entries</div>
          </div>
          <table className="tx-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx) => {
                const cat = allCats.find((c) => c.id === tx.cat);
                const isAdd = tx.amt > 0;
                const date = new Date(tx.date);
                return (
                  <tr key={tx.id} onClick={() => !isPartner && onEdit({ type: 'tx', item: tx })}>
                    <td className="tx-when">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </td>
                    <td>{tx.label}</td>
                    <td>
                      {cat ? (
                        <span className="tx-tag">
                          <span className="dot" style={{ background: cat.color }} />{cat.name}
                        </span>
                      ) : (
                        <span className="tx-tag" style={{ background: '#dde6d4', color: 'var(--moss)' }}>Income</span>
                      )}
                    </td>
                    <td className={`tx-amt ${isAdd ? 'add' : 'sub'} blur${hidden ? '' : ' on'}`}>
                      {formatPHP(tx.amt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function WebPayments({
  data, isPartner, onEdit, onMarkPaid,
}: {
  data: UserData; isPartner: boolean; onEdit: (e: EditingState) => void; onMarkPaid: (id: string) => void;
}) {
  const billsDue = data.bills.filter((b) => b.status === 'due');
  const totalDue = billsDue.reduce((a, b) => a + b.amount, 0);
  const totalDebt = data.debts.reduce((a, d) => a + (d.total - d.paid), 0);

  return (
    <>
      <div className="metric-row">
        <div className="metric">
          <div className="label">Due this month</div>
          <div className="value">{formatPHP(totalDue, { short: true })}</div>
          <div className="delta neg">{billsDue.length} bills pending</div>
        </div>
        <div className="metric">
          <div className="label">Owed total</div>
          <div className="value">{formatPHP(totalDebt, { short: true })}</div>
          <div className="delta">across {data.debts.length} loans</div>
        </div>
        <div className="metric">
          <div className="label">Paid this month</div>
          <div className="value">{data.bills.filter((b) => b.status === 'paid').length}</div>
          <div className="delta">of {data.bills.length} bills</div>
        </div>
        <div className="metric">
          <div className="label">Next due</div>
          <div className="value" style={{ fontSize: 24 }}>{billsDue[0]?.name ?? 'None'}</div>
          <div className="delta neg">
            {billsDue[0] ? `day ${billsDue[0].due} · ${formatPHP(billsDue[0].amount, { short: true })}` : ''}
          </div>
        </div>
      </div>

      <div className="pay-cols">
        <div>
          <div className="col-head">
            <h3>Recurring bills</h3>
            {!isPartner && (
              <button className="btn-add ghost" onClick={() => onEdit({ type: 'bill' })}>
                {Icons.plus({ size: 14, stroke: 'currentColor' })} Bill
              </button>
            )}
          </div>
          <table className="bills-table">
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>Bill</th>
                <th>Status</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.bills.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className={`mark-paid-btn${b.status === 'paid' ? ' checked' : ''}`}
                      onClick={(e) => { e.stopPropagation(); if (!isPartner) onMarkPaid(b.id); }}
                    >
                      {Icons.check({ size: 11, stroke: '#fff' })}
                    </button>
                  </td>
                  <td
                    onClick={() => !isPartner && onEdit({ type: 'bill', item: b })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 14 }}>{b.name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
                      MONTHLY · DAY {b.due}
                    </div>
                  </td>
                  <td>
                    <span className={`ribbon ${b.status}`}>
                      {b.status === 'paid' ? '✓ Paid' : `Due day ${b.due}`}
                    </span>
                  </td>
                  <td className="bt-amt" style={{ opacity: b.status === 'paid' ? 0.5 : 1 }}>
                    {formatPHP(b.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="col-head">
            <h3>Owed & installments</h3>
            {!isPartner && (
              <button className="btn-add ghost" onClick={() => onEdit({ type: 'debt' })}>
                {Icons.plus({ size: 14, stroke: 'currentColor' })} Debt
              </button>
            )}
          </div>
          {data.debts.map((d) => {
            const remaining = d.total - d.paid;
            const pct = d.total > 0 ? (d.paid / d.total) * 100 : 0;
            const dueDate = new Date(d.due);
            const daysLeft = Math.round((dueDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
            const overdue = daysLeft < 0;
            return (
              <div key={d.id} className="debt-card" onClick={() => !isPartner && onEdit({ type: 'debt', item: d })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{d.name}</div>
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: overdue ? 'var(--clay)' : 'var(--ink-mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                    >
                      {d.months > 0 ? `${d.paidMonths}/${d.months} payments · ` : ''}
                      {overdue ? `${Math.abs(daysLeft)} DAYS OVERDUE` : `${daysLeft} DAYS LEFT`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="amount" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{formatPHP(remaining)}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.05em' }}>
                      of {formatPHP(d.total)}
                    </div>
                  </div>
                </div>
                <div className="progress">
                  <div style={{ width: pct + '%', background: overdue ? 'var(--clay)' : 'var(--ink)' }} />
                </div>
                <div className="mono" style={{ textAlign: 'right', fontSize: 9, letterSpacing: '0.14em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginTop: 6 }}>
                  {pct.toFixed(0)}% paid
                </div>
              </div>
            );
          })}
          {data.debts.length === 0 && (
            <div className="card white" style={{ textAlign: 'center', padding: 30, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
              No debts tracked. Pristine.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
