import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { FocusSettings } from '../../types';
import { Sheet, Toggle } from '../ui/shared';
import { Icons } from '../Icons';

interface Props {
  onClose: () => void;
}

export function FocusSettingsForm({ onClose }: Props) {
  const storeSettings = useAppStore(s => s.focusSettings);
  const setFocusSettings = useAppStore(s => s.setFocusSettings);
  
  const [local, setLocal] = useState<any>(storeSettings);

  const handleSave = () => {
    setFocusSettings({
      ...local,
      focusDuration: Math.max(1, Number(local.focusDuration) || 1),
      shortBreakDuration: Math.max(1, Number(local.shortBreakDuration) || 1),
      longBreakDuration: Math.max(1, Number(local.longBreakDuration) || 1),
      longBreakInterval: Math.max(1, Number(local.longBreakInterval) || 1),
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, lineHeight: 1 }}>Timer Settings</div>
        <button className="icon-btn" onClick={onClose} style={{ transform: 'rotate(45deg)', margin: '-10px' }}>
          {Icons.plus({ size: 24, stroke: 'currentColor' })}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <label className="field" style={{ flex: 1, minWidth: 0 }}>
            <span className="field-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Focus (min)</span>
            <input type="number" style={{ minWidth: 0, paddingLeft: 8, paddingRight: 8 }} value={local.focusDuration} onChange={e => setLocal({...local, focusDuration: e.target.value === '' ? '' : Number(e.target.value)})} min={1} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 0 }}>
            <span className="field-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Short Break</span>
            <input type="number" style={{ minWidth: 0, paddingLeft: 8, paddingRight: 8 }} value={local.shortBreakDuration} onChange={e => setLocal({...local, shortBreakDuration: e.target.value === '' ? '' : Number(e.target.value)})} min={1} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 0 }}>
            <span className="field-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Long Break</span>
            <input type="number" style={{ minWidth: 0, paddingLeft: 8, paddingRight: 8 }} value={local.longBreakDuration} onChange={e => setLocal({...local, longBreakDuration: e.target.value === '' ? '' : Number(e.target.value)})} min={1} />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--hair-strong)' }}>
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Auto-start Breaks</span>
          <Toggle on={local.autoStartBreaks} onToggle={() => setLocal({...local, autoStartBreaks: !local.autoStartBreaks})} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--hair-strong)' }}>
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Auto-start Focus</span>
          <Toggle on={local.autoStartFocus} onToggle={() => setLocal({...local, autoStartFocus: !local.autoStartFocus})} />
        </div>

        <label className="field" style={{ marginTop: '12px' }}>
          <span className="field-label">Long Break Interval (sessions)</span>
          <input type="number" value={local.longBreakInterval} onChange={e => setLocal({...local, longBreakInterval: e.target.value === '' ? '' : Number(e.target.value)})} min={1} />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Use 24-hour Format</span>
          <Toggle on={local.use24HourFormat} onToggle={() => setLocal({...local, use24HourFormat: !local.use24HourFormat})} />
        </div>

        <button 
          onClick={handleSave} 
          style={{ 
            marginTop: '20px', 
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', 
            padding: '12px 16px', borderRadius: 10, background: 'var(--ink)', color: 'var(--cream)', 
            border: 'none', cursor: 'pointer', textAlign: 'center', fontWeight: 600
          }}
        >
          Save Settings
        </button>
      </div>
    </Sheet>
  );
}
