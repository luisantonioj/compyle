import { describe, expect, it } from 'vitest';
import { extractNotePreview } from './noteUtils';

describe('extractNotePreview', () => {
  it('extracts readable text from Tiptap JSON content', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', content: [{ type: 'text', text: 'Trip plan' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Book tickets' }] },
      ],
    });

    expect(extractNotePreview(content)).toBe('Trip plan, Book tickets');
  });

  it('falls back for invalid or empty note content', () => {
    expect(extractNotePreview('{bad json')).toBe('Untitled note');
    expect(extractNotePreview(JSON.stringify({ type: 'doc', content: [] }))).toBe('Untitled note');
  });

  it('truncates long previews to the requested length', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A long note preview' }] }],
    });

    expect(extractNotePreview(content, 8)).toHaveLength(11);
    expect(extractNotePreview(content, 8).startsWith('A long n')).toBe(true);
  });
});
