import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import type { FocusSettings } from '../../types';
import { FormFoot, FormHead, FormSheet, Field } from './FormPrimitives';
import { Toggle } from '../ui/shared';

interface Props {
  onClose: () => void;
}

export function FocusSettingsForm({ onClose }: Props) {
  const storeSettings = useAppStore(s => s.focusSettings);
  const setFocusSettings = useAppStore(s => s.setFocusSettings);
  const [local, setLocal] = useState<FocusSettings>(storeSettings);

  const update = <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => {
    setLocal(current => ({ ...current, [key]: value }));
  };

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

  return createPortal((
    <FormSheet onClose={onClose} className="focus-settings-sheet">
      <FormHead kicker="Focus settings" title="Tune your" accent="session" onClose={onClose} />

      <div className="form-body focus-settings-body">
        <section className="focus-settings-section" aria-labelledby="focus-duration-heading">
          <div className="focus-settings-section-title" id="focus-duration-heading">Session durations</div>
          <div className="focus-settings-duration-grid">
            <Field label="Focus (min)">
              <input className="field-input" type="number" min={1} inputMode="numeric" value={local.focusDuration}
                onChange={event => update('focusDuration', event.target.value === '' ? 0 : Number(event.target.value))} />
            </Field>
            <Field label="Short break">
              <input className="field-input" type="number" min={1} inputMode="numeric" value={local.shortBreakDuration}
                onChange={event => update('shortBreakDuration', event.target.value === '' ? 0 : Number(event.target.value))} />
            </Field>
            <Field label="Long break">
              <input className="field-input" type="number" min={1} inputMode="numeric" value={local.longBreakDuration}
                onChange={event => update('longBreakDuration', event.target.value === '' ? 0 : Number(event.target.value))} />
            </Field>
          </div>
        </section>

        <section className="focus-settings-section" aria-labelledby="focus-automation-heading">
          <div className="focus-settings-section-title" id="focus-automation-heading">Automation</div>
          <div className="focus-settings-options">
            <div className="focus-settings-option">
              <span>Auto-start breaks</span>
              <Toggle label="Auto-start breaks" on={local.autoStartBreaks} onToggle={() => update('autoStartBreaks', !local.autoStartBreaks)} />
            </div>
            <div className="focus-settings-option">
              <span>Auto-start focus</span>
              <Toggle label="Auto-start focus" on={local.autoStartFocus} onToggle={() => update('autoStartFocus', !local.autoStartFocus)} />
            </div>
          </div>
        </section>

        <section className="focus-settings-section" aria-labelledby="focus-clock-heading">
          <div className="focus-settings-section-title" id="focus-clock-heading">Clock</div>
          <Field label="Long break interval (sessions)">
            <input className="field-input" type="number" min={1} inputMode="numeric" value={local.longBreakInterval}
              onChange={event => update('longBreakInterval', event.target.value === '' ? 0 : Number(event.target.value))} />
          </Field>
          <div className="focus-settings-option focus-settings-option-last">
            <span>Use 24-hour format</span>
            <Toggle label="Use 24-hour format" on={local.use24HourFormat} onToggle={() => update('use24HourFormat', !local.use24HourFormat)} />
          </div>
        </section>
      </div>

      <FormFoot onSave={handleSave} onCancel={onClose} saveLabel="Save settings" />
    </FormSheet>
  ), document.body);
}
