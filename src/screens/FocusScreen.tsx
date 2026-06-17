import React, { useState } from 'react';
import { FocusTimerUI } from '../components/ui/FocusTimerUI';
import { FocusSettingsForm } from '../components/forms/FocusSettingsForm';
import { Icons } from '../components/Icons';

interface Props {
  viewMode: string;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
}

export function FocusScreen({ viewMode, isPartner, profileInitial, onProfile }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="screen fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div className="top-bar">
        <div>
          <div className="kicker">Focus</div>
          <h1>Timer <em>Mode</em></h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button className="icon-btn" onClick={() => setShowSettings(true)} style={{ padding: '4px' }}>
            {Icons.sliders({ size: 20, stroke: 'var(--ink)' })}
          </button>
          <button className={`profile-pill${viewMode === 'partner' ? ' partner' : ''}`} onClick={onProfile}>
            {profileInitial}
            <span className="dot" />
          </button>
        </div>
      </div>

      <div className="scroll-content safe-bottom" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <FocusTimerUI />
      </div>

      </div>
      {showSettings && (
        <FocusSettingsForm onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
