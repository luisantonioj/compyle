import React, { useState } from 'react';
import { FocusTimerUI } from '../../components/ui/FocusTimerUI';
import { FocusSettingsForm } from '../../components/forms/FocusSettingsForm';
import { Icons } from '../../components/Icons';

export function WebFocusScreen() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <div>
          <div className="kicker">Focus</div>
          <h1>Current <em>Session</em></h1>
        </div>
        <button className="btn-add" onClick={() => setShowSettings(true)}>
          {Icons.sliders({ size: 14, stroke: 'var(--cream)' })}
          <span>Settings</span>
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <FocusTimerUI />
      </div>

      {showSettings && (
        <FocusSettingsForm onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
