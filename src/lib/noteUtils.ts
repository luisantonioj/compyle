// Utilities for Note card previews and relative timestamps

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

function walk(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(walk).join(' ');
}

export function extractNotePreview(contentJson: string, maxLength = 120): string {
  try {
    const doc = JSON.parse(contentJson) as TiptapNode;
    const text = walk(doc).replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  } catch {
    return '';
  }
}

export function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
