// compyle — all CRUD form sheets
import React, { useState, useEffect } from 'react';
import { FormSheet, FormHead, FormFoot, Field, EmojiPicker, ColorPicker, HABIT_FREQS, CAT_COLORS, BANK_COLORS } from './FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import type { Task, Habit, Transaction, BankAccount, Category, Bill, Debt } from '../../types';

// ─── Task form ───
export function TaskForm({ task, dateKey, onSave, onDelete, onClose }: {
  task?: Task; dateKey: string;
  onSave: (task: Task, dateKey: string) => void;
  onDelete?: (id: string, dateKey: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [emoji, setEmoji] = useState(task?.emoji ?? '⭐');
  const [time, setTime] = useState(task?.time ?? '');
  const [date, setDate] = useState(dateKey);
  const editing = !!task?.id;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: task?.id ?? 't_' + Date.now(), title: title.trim(), emoji, time: time || null, done: task?.done ?? false }, date);
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit task' : 'New task'} title={editing ? 'Update' : 'Add'} accent="task" onClose={onClose}/>
      <div className="form-body">
        <Field label="Title">
          <input className="field-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the task?"/>
        </Field>
        <Field label="Type">
          <EmojiPicker value={emoji} onChange={setEmoji}/>
        </Field>
        <div className="field-row">
          <Field label="Date">
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)}/>
          </Field>
          <Field label="Time (optional)">
            <input type="time" className="field-input" value={time} onChange={(e) => setTime(e.target.value)}/>
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-mute)' }}>
          🔔 {time ? `Reminder set for ${time}` : 'No reminder set'}
        </div>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(task!.id, date) : undefined}
        canSave={!!title.trim()} saveLabel={editing ? 'Save' : 'Add task'}
      />
    </FormSheet>
  );
}

// ─── Habit form ───
export function HabitForm({ habit, onSave, onDelete, onClose }: {
  habit?: Habit;
  onSave: (h: Habit) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const [note, setNote] = useState(habit?.note ?? 'Daily');
  const editing = !!habit?.id;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: habit?.id ?? 'h_' + Date.now(),
      name: name.trim(), note,
      streak: habit?.streak ?? 0,
      doneToday: habit?.doneToday ?? false,
      pattern: habit?.pattern ?? 'off,'.repeat(27) + 'off',
    });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit habit' : 'New habit'} title={editing ? 'Update' : 'Build a'} accent={editing ? '' : 'habit'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Habit name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Floss"/>
        </Field>
        <Field label="Frequency">
          <div className="chips">
            {HABIT_FREQS.map((f) => (
              <button key={f} type="button" className={note === f ? 'selected' : ''} onClick={() => setNote(f)}>{f}</button>
            ))}
          </div>
        </Field>
        {editing && (
          <div style={{ background: 'var(--cream-deep)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="field-label" style={{ marginBottom: 2 }}>Current streak</div>
              <div className="amount" style={{ fontSize: 22 }}>🔥 {habit!.streak} days</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', textAlign: 'right' }}>KEEP IT GOING</div>
          </div>
        )}
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(habit!.id) : undefined}
        canSave={!!name.trim()} saveLabel={editing ? 'Save' : 'Start habit'}
      />
    </FormSheet>
  );
}

// ─── Transaction form ───
export function TransactionForm({ tx, banks, onSave, onDelete, onClose }: {
  tx?: Transaction; banks: BankAccount[];
  onSave: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'add' | 'deduct'>(tx ? (tx.amt > 0 ? 'add' : 'deduct') : 'deduct');
  const [amount, setAmount] = useState(tx ? String(Math.abs(tx.amt)) : '');
  const [label, setLabel] = useState(tx?.label ?? '');
  const [bank, setBank] = useState(tx?.bank ?? banks[0]?.id ?? '');
  const [cat, setCat] = useState<string>(() => {
    if (tx?.cat) return tx.cat;
    const b = banks.find((x) => x.id === (tx?.bank ?? banks[0]?.id));
    return b?.categories?.[0]?.id ?? '';
  });
  const editing = !!tx?.id;

  const selectedBank = banks.find((b) => b.id === bank);
  const cats = selectedBank?.categories ?? [];
  useEffect(() => { if (!cats.find((c) => c.id === cat)) setCat(cats[0]?.id ?? ''); }, [bank]);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || !label.trim()) return;
    onSave({
      id: tx?.id ?? 'tx_' + Date.now(),
      bank, cat, label: label.trim(),
      amt: type === 'add' ? Math.abs(num) : -Math.abs(num),
      date: tx?.date ?? TODAY_KEY,
      time: tx?.time ?? new Date().toTimeString().slice(0, 5),
    });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit transaction' : 'New entry'} title={editing ? 'Update' : 'Record'} accent={editing ? '' : (type === 'add' ? 'income' : 'spend')} onClose={onClose}/>
      <div className="form-body">
        <div className="type-toggle">
          <button className={`add${type === 'add' ? ' active' : ''}`} onClick={() => setType('add')}>+ Add money</button>
          <button className={`deduct${type === 'deduct' ? ' active' : ''}`} onClick={() => setType('deduct')}>− Spend</button>
        </div>
        <Field label="Amount (PHP)">
          <input className="field-input big" type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus/>
        </Field>
        <Field label="Description">
          <input className="field-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Sephora — toner refill"/>
        </Field>
        <Field label="From account">
          <div className="chips">
            {banks.map((b) => (
              <button key={b.id} type="button" className={bank === b.id ? 'selected' : ''} onClick={() => setBank(b.id)}>
                <span className="dot" style={{ background: b.color }} />{b.name}
              </button>
            ))}
          </div>
        </Field>
        {cats.length > 0 && (
          <Field label="Category bucket">
            <div className="chips">
              {cats.map((c) => (
                <button key={c.id} type="button" className={cat === c.id ? 'selected' : ''} onClick={() => setCat(c.id)}>
                  <span className="dot" style={{ background: c.color }} />{c.name}
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(tx!.id) : undefined}
        canSave={!!amount && !!label.trim() && !!bank}
        saveLabel={editing ? 'Save' : (type === 'add' ? '₱ Record income' : 'Record spend')}
      />
    </FormSheet>
  );
}

// ─── Account form ───
export function AccountForm({ acct, onSave, onDelete, onClose }: {
  acct?: BankAccount;
  onSave: (a: BankAccount) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(acct?.name ?? '');
  const [balance, setBalance] = useState(acct ? String(acct.balance) : '');
  const [last4, setLast4] = useState(acct?.last4 ?? '');
  const [color, setColor] = useState(acct?.color ?? BANK_COLORS[0]);
  const editing = !!acct?.id;

  const handleSave = () => {
    if (!name.trim() || !balance) return;
    onSave({ id: acct?.id ?? 'b_' + Date.now(), name: name.trim(), balance: parseFloat(balance) || 0, last4: last4 || '0000', color, categories: acct?.categories ?? [] });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit account' : 'New account'} title={editing ? 'Update' : 'Add an'} accent={editing ? '' : 'account'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Bank or wallet">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BPI Savings"/>
        </Field>
        <div className="field-row">
          <Field label="Balance (PHP)">
            <input className="field-input" type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00"/>
          </Field>
          <Field label="Last 4 digits">
            <input className="field-input" value={last4} onChange={(e) => setLast4(e.target.value.slice(0, 4))} placeholder="1234" maxLength={4}/>
          </Field>
        </div>
        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} palette={BANK_COLORS}/>
        </Field>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(acct!.id) : undefined}
        canSave={!!name.trim() && !!balance} saveLabel={editing ? 'Save' : 'Add account'}
      />
    </FormSheet>
  );
}

// ─── Category form ───
export function CategoryForm({ cat, banks, onSave, onDelete, onClose }: {
  cat?: Category & { bankId?: string }; banks: BankAccount[];
  onSave: (c: Category & { bankId: string }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(cat?.name ?? '');
  const [balance, setBalance] = useState(cat ? String(cat.balance ?? 0) : '');
  const [bankId, setBankId] = useState(cat?.bankId ?? banks[0]?.id ?? '');
  const [color, setColor] = useState(cat?.color ?? CAT_COLORS[0]);
  const editing = !!cat?.id;

  const handleSave = () => {
    if (!name.trim() || !bankId) return;
    onSave({ id: cat?.id ?? 'c_' + Date.now(), bankId, name: name.trim(), balance: parseFloat(balance) || 0, color });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit category' : 'New category'} title={editing ? 'Update' : 'Add a'} accent={editing ? '' : 'category'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Lives under account">
          <div className="chips">
            {banks.map((b) => (
              <button key={b.id} type="button" className={bankId === b.id ? 'selected' : ''} onClick={() => setBankId(b.id)}>
                <span className="dot" style={{ background: b.color }} />{b.name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Category name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries"/>
        </Field>
        <Field label="Starting balance (PHP)">
          <input className="field-input big" type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0"/>
        </Field>
        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} palette={CAT_COLORS}/>
        </Field>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(cat!.id) : undefined}
        canSave={!!name.trim() && !!bankId} saveLabel={editing ? 'Save' : 'Create'}
      />
    </FormSheet>
  );
}

// ─── Bill form ───
export function BillForm({ bill, onSave, onDelete, onClose }: {
  bill?: Bill;
  onSave: (b: Bill) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? '');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [due, setDue] = useState(bill ? String(bill.due) : '15');
  const editing = !!bill?.id;

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    onSave({ id: bill?.id ?? 'p_' + Date.now(), name: name.trim(), amount: parseFloat(amount) || 0, due: Math.min(31, Math.max(1, parseInt(due, 10) || 1)), status: bill?.status ?? 'due' });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit bill' : 'New recurring bill'} title={editing ? 'Update' : 'Add a'} accent={editing ? '' : 'bill'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Bill name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Globe Fiber"/>
        </Field>
        <div className="field-row">
          <Field label="Amount (PHP)">
            <input className="field-input" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"/>
          </Field>
          <Field label="Due day of month">
            <input className="field-input" type="number" min="1" max="31" value={due} onChange={(e) => setDue(e.target.value)}/>
          </Field>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Reminds you 3 days before due date. Auto-resets each month.</div>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(bill!.id) : undefined}
        canSave={!!name.trim() && !!amount} saveLabel={editing ? 'Save' : 'Add bill'}
      />
    </FormSheet>
  );
}

// ─── Debt form ───
export function DebtForm({ debt, onSave, onDelete, onClose }: {
  debt?: Debt;
  onSave: (d: Debt) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(debt?.name ?? '');
  const [total, setTotal] = useState(debt ? String(debt.total) : '');
  const [paid, setPaid] = useState(debt ? String(debt.paid) : '0');
  const [due, setDue] = useState(debt?.due ?? '');
  const [months, setMonths] = useState(debt ? String(debt.months) : '0');
  const editing = !!debt?.id;

  const handleSave = () => {
    if (!name.trim() || !total) return;
    onSave({
      id: debt?.id ?? 'd_' + Date.now(), name: name.trim(),
      total: parseFloat(total) || 0, paid: parseFloat(paid) || 0,
      due: due || TODAY_KEY, months: parseInt(months, 10) || 0,
      paidMonths: debt?.paidMonths ?? 0,
    });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit debt' : 'Track a debt'} title={editing ? 'Update' : 'Add'} accent={editing ? '' : 'owed'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Creditor / description">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SPayLater — phone case"/>
        </Field>
        <div className="field-row">
          <Field label="Total owed">
            <input className="field-input" type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0"/>
          </Field>
          <Field label="Already paid">
            <input className="field-input" type="number" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0"/>
          </Field>
        </div>
        <div className="field-row">
          <Field label="Due date">
            <input type="date" className="field-input" value={due} onChange={(e) => setDue(e.target.value)}/>
          </Field>
          <Field label="Installments (optional)">
            <input className="field-input" type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="0"/>
          </Field>
        </div>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(debt!.id) : undefined}
        canSave={!!name.trim() && !!total} saveLabel={editing ? 'Save' : 'Track'}
      />
    </FormSheet>
  );
}
