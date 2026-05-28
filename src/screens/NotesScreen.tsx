// compyle — Notes tab (mobile)
import React from 'react';
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
  const { notes } = data;

  return (
    <div className="screen">
      <div className="top-bar">
        <div>
          <div className="kicker">Personal notes</div>
          <h1>Your <em>notes</em></h1>
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
        {notes.length === 0 ? (
          <div className="card white">
            <div className="notes-empty">Nothing written yet.<br />Tap + to start a new note.</div>
          </div>
        ) : (
          notes.map((note) => (
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
      </div>
    </div>
  );
}
