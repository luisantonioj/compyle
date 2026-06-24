import { useEffect, useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field, ColorPicker, CAT_COLORS, BANK_COLORS } from '../../components/forms/FormPrimitives';
import { TODAY_KEY } from '../../lib/seed';
import { createId } from '../../lib/ids';
import type { Transaction, BankAccount, Category, Bill, Debt } from '../../types';

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
      id: tx?.id ?? createId('tx'),
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
          <button className={`deduct${type === 'deduct' ? ' active' : ''}`} onClick={() => setType('deduct')}>- Spend</button>
        </div>
        <Field label="Amount (PHP)">
          <input className="field-input big" type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus/>
        </Field>
        <Field label="Description">
          <input className="field-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Sephora - toner refill"/>
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
        saveLabel={editing ? 'Save' : (type === 'add' ? 'Record income' : 'Record spend')}
      />
    </FormSheet>
  );
}

// Account form
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
    onSave({ id: acct?.id ?? createId('b'), name: name.trim(), balance: parseFloat(balance) || 0, last4: last4 || '0000', color, categories: acct?.categories ?? [] });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit account' : 'New account'} title={editing ? 'Update' : 'Add an'} accent={editing ? '' : 'account'} onClose={onClose}/>
      <div className="form-body">
        <Field label="Bank or wallet">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BPI Savings"/>
        </Field>
        <Field label="Balance (PHP)">
          <input className="field-input" type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00"/>
        </Field>
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

// Category form
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
    onSave({ id: cat?.id ?? createId('c'), bankId, name: name.trim(), balance: parseFloat(balance) || 0, color });
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

// Bill form
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
    onSave({ id: bill?.id ?? createId('p'), name: name.trim(), amount: parseFloat(amount) || 0, due: Math.min(31, Math.max(1, parseInt(due, 10) || 1)), status: bill?.status ?? 'due' });
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

// Debt form
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
      id: debt?.id ?? createId('d'), name: name.trim(),
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
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SPayLater - phone case"/>
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

// Link Category form

