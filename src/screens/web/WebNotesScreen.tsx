// compyle — Notes tab (web / desktop)
import React from 'react';
import { Icons } from '../../components/Icons';
import type { UserData, EditingState } from '../../types';
import { extractNotePreview, relativeDate } from '../../lib/noteUtils';
import '../../styles/notes.css';

interface WebNotesScreenProps {
  data: UserData;
  isPartner: boolean;
  onEdit: (state: EditingState) => void;
}

export function WebNotesScreen({ data, isPartner, onEdit }: WebNotesScreenProps) {
  const { notes } = data;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Personal notes</div>
          <h1>Your <em>notes</em></h1>
        </div>
        {!isPartner && (
          <button className="btn-add" onClick={() => onEdit({ type: 'note' })}>
            {Icons.plus({ size: 14, stroke: 'var(--cream)' })}
            <span>New note</span>
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="card white" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
            Nothing written yet.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 8 }}>
            Click "New note" to start writing
          </div>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="card white" style={{ padding: '14px 18px' }}>
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
      )}
    </div>
  );
}
