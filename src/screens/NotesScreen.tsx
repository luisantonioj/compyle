// compyle — Notes tab (mobile)
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import type { UserData, ViewMode, EditingState } from '../types';
import { extractNotePreview, relativeDate } from '../lib/noteUtils';
import '../styles/notes.css';

interface NotesScreenProps {
  data: UserData;
  viewMode: ViewMode;
  isPartner: boolean;
  profileInitial: string;
  onProfile: () => void;
  onEdit: (state: EditingState) => void;
}

export function NotesScreen({ data, isPartner, profileInitial, onProfile, onEdit }: NotesScreenProps) {
  const [showArchived, setShowArchived] = useState(false);

  const activeNotes = data.notes.filter((n) => !n.archived);
  const archivedNotes = data.notes.filter((n) => n.archived);

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Notes</div>
          <h1>Personal <em>Notebook</em></h1>
        </div>
        <button
          className={`profile-pill${isPartner ? ' partner' : ''}`}
          onClick={onProfile}
        >
          {profileInitial}
          <span className="dot" />
        </button>
      </div>

      <div className="notes-list">
        {activeNotes.length === 0 && archivedNotes.length === 0 ? (
          <div className="card white">
            <div className="notes-empty">Nothing written yet.<br />Tap + to start a new note.</div>
          </div>
        ) : (
          activeNotes.map((note) => (
            <div key={note.id} className="card white" style={{ padding: '14px 16px' }}>
              <button
                className="note-card-btn"
                onClick={() => onEdit({ type: 'note', item: note })}
              >
                <div className="note-card-title">{note.title}</div>
                <div className="note-preview">{extractNotePreview(note.content)}</div>
                <div className="note-card-date">{relativeDate(note.updated_at)}</div>
              </button>
            </div>
          ))
        )}

        {archivedNotes.length > 0 && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              width: '100%', padding: '10px', borderRadius: 12,
              border: '1px dashed var(--hair-strong)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
              marginTop: activeNotes.length > 0 ? 4 : 0,
            }}
          >
            {showArchived ? '↑ Hide archived' : <>{Icons.archive({ stroke: 'currentColor' })} {archivedNotes.length} archived</>}
          </button>
        )}

        {showArchived && archivedNotes.map((note) => (
          <div key={note.id} className="card white" style={{ padding: '14px 16px', opacity: 0.6 }}>
            <button
              className="note-card-btn"
              onClick={() => onEdit({ type: 'note', item: note })}
            >
              <div className="note-card-title">{note.title}</div>
              <div className="note-preview">{extractNotePreview(note.content)}</div>
              <div className="note-card-date">{relativeDate(note.updated_at)}</div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
