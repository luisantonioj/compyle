// compyle - rich-text note form using Tiptap
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { FormSheet, FormHead, FormFoot } from '../../components/forms/FormPrimitives';
import { createId } from '../../lib/ids';
import type { Note } from '../../types';
import '../../styles/notes.css';

interface NoteFormProps {
  note?: Note;
  onSave: (n: Note) => void;
  onAutosave?: (n: Note) => void;
  onDelete?: (id: string) => void;
  onArchive?: () => void;
  archiveLabel?: 'Archive' | 'Restore';
  onClose: () => void;
}

export function NoteForm({ note, onSave, onAutosave, onDelete, onArchive, archiveLabel, onClose }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [draftId, setDraftId] = useState(() => note?.id ?? createId('n'));
  const [content, setContent] = useState(note?.content ?? '{}');
  const [bodyText, setBodyText] = useState('');
  const lastSavedSignatureRef = useRef(`${note?.title ?? ''}\n${note?.content ?? '{}'}`);
  const isEditing = !!note?.id;

  useEffect(() => {
    setDraftId(note?.id ?? createId('n'));
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '{}');
    setBodyText('');
    lastSavedSignatureRef.current = `${note?.title ?? ''}\n${note?.content ?? '{}'}`;
  }, [note?.id, note?.title, note?.content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      TaskList,
      TaskItem.configure({ nested: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: note?.content ? (JSON.parse(note.content) as object) : undefined,
    editorProps: {
      attributes: { class: 'note-editor-body' },
    },
    onUpdate: ({ editor }) => {
      setContent(JSON.stringify(editor.getJSON()));
      setBodyText(editor.getText());
    },
  });

  const buildNote = useCallback((): Note => ({
    ...note,
    id: draftId,
    title: title.trim() || 'Untitled note',
    content: editor ? JSON.stringify(editor.getJSON()) : content,
    updated_at: Date.now(),
  }), [content, draftId, editor, note, title]);

  const hasDraftContent = title.trim().length > 0 || bodyText.trim().length > 0;

  useEffect(() => {
    if (!onAutosave || !hasDraftContent) return;

    const noteToSave = buildNote();
    const signature = `${noteToSave.title}\n${noteToSave.content}`;
    if (signature === lastSavedSignatureRef.current) return;

    const timeout = window.setTimeout(() => {
      onAutosave(noteToSave);
      lastSavedSignatureRef.current = signature;
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [buildNote, title, content, bodyText, draftId, onAutosave, hasDraftContent]);

  const handleSave = () => {
    if (!hasDraftContent) return;
    const noteToSave = {
      ...buildNote(),
      updated_at: Date.now(),
    };
    onSave(noteToSave);
    lastSavedSignatureRef.current = `${noteToSave.title}\n${noteToSave.content}`;
  };

  return (
    <FormSheet onClose={onClose} className="note-form-sheet">
      <div className="note-form-header-area">
        <FormHead
          kicker={isEditing ? 'Edit note' : 'New note'}
          title={isEditing ? 'Update' : 'Write a'}
          accent="note"
          onClose={onClose}
        />
        <div className="note-title-toolbar-wrap">
          <input
            className="field-input note-title-input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus(); } }}
          />
          <div className="note-toolbar">
            <button
              type="button"
              className={`note-toolbar-btn${editor?.isActive('bold') ? ' active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              className={`note-toolbar-btn${editor?.isActive('bulletList') ? ' active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
              title="Bullet list"
            >
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                <circle cx="1.5" cy="2" r="1.5" fill="currentColor"/>
                <circle cx="1.5" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="1.5" cy="10" r="1.5" fill="currentColor"/>
                <path d="M5 2h9M5 6h9M5 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              type="button"
              className={`note-toolbar-btn${editor?.isActive('taskList') ? ' active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleTaskList().run(); }}
              title="Checklist"
            >
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                <rect x="0.5" y="0.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 2l1 1 1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="0.5" y="4.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="0.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 2h8M6 6h8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="note-form-scrollable-area">
        <div className="form-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <EditorContent editor={editor} className="note-editor-wrap" />
        </div>
        <FormFoot
          onSave={handleSave}
          onCancel={onClose}
          onDelete={isEditing && onDelete ? () => onDelete(note!.id) : undefined}
          onArchive={isEditing ? onArchive : undefined}
          archiveLabel={archiveLabel}
          canSave={hasDraftContent}
        />
      </div>
    </FormSheet>
  );
}

