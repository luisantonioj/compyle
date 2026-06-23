import React, { useRef, useState } from 'react';
import { FormSheet, FormHead, FormFoot, Field, ColorPicker, CAT_COLORS } from '../../components/forms/FormPrimitives';
import type { LinkCategory, LinkItem } from '../../types';

export function LinkCategoryForm({ cat, onSave, onDelete, onArchive, archiveLabel, onClose }: {
  cat?: LinkCategory;
  onSave: (cat: LinkCategory) => void;
  onDelete?: (id: string) => void;
  onArchive?: () => void;
  archiveLabel?: 'Archive' | 'Restore';
  onClose: () => void;
}) {
  const editing = !!cat?.id;
  const [name, setName] = useState(cat?.name ?? '');
  const [color, setColor] = useState(cat?.color ?? CAT_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: cat?.id ?? 'lc_' + Date.now(), name: name.trim(), color, sort_order: cat?.sort_order });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit category' : 'New category'} title={editing ? 'Update' : 'Add a'} accent="category" onClose={onClose} />
      <div className="form-body">
        <Field label="Category name">
          <input className="field-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. School, Hobbies" />
        </Field>
        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} palette={CAT_COLORS} />
        </Field>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(cat!.id) : undefined}
        onArchive={editing ? onArchive : undefined}
        archiveLabel={archiveLabel}
        canSave={!!name.trim()} saveLabel={editing ? 'Save' : 'Create'}
      />
    </FormSheet>
  );
}

// â”€â”€â”€ Link Item form â”€â”€â”€
export function LinkItemForm({ link, categoryId, onSave, onDelete, onArchive, archiveLabel, onClose }: {
  link?: LinkItem;
  categoryId: string;
  onSave: (link: LinkItem) => void;
  onDelete?: (id: string) => void;
  onArchive?: () => void;
  archiveLabel?: 'Archive' | 'Restore';
  onClose: () => void;
}) {
  const editing = !!link?.id;
  const [title, setTitle] = useState(link?.title ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [description, setDescription] = useState(link?.description ?? '');
  const [customEmoji, setCustomEmoji] = useState(link?.customEmoji ?? '');
  const [customImageUrl, setCustomImageUrl] = useState(link?.customImageUrl ?? '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
        else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setCustomImageUrl(canvas.toDataURL('image/jpeg', 0.8));
          setCustomEmoji('');
        }
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim() || !url.trim()) return;
    const normalizedUrl = url.trim().match(/^https?:\/\//) ? url.trim() : 'https://' + url.trim();
    onSave({
      id: link?.id ?? 'li_' + Date.now(),
      categoryId: link?.categoryId ?? categoryId,
      title: title.trim(),
      url: normalizedUrl,
      description: description.trim() || undefined,
      customEmoji: customEmoji || undefined,
      customImageUrl: customImageUrl || undefined,
    });
  };

  return (
    <FormSheet onClose={onClose}>
      <FormHead kicker={editing ? 'Edit link' : 'New link'} title={editing ? 'Update' : 'Add a'} accent="link" onClose={onClose} />
      <div className="form-body">
        <Field label="Title">
          <input className="field-input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DLSL Portal" />
        </Field>
        <Field label="URL">
          <input className="field-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Custom Icon (Optional)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--hair-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', overflow: 'hidden', flexShrink: 0 }}>
              {customImageUrl ? (
                <img src={customImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : customEmoji ? (
                <span style={{ fontSize: 24 }}>{customEmoji}</span>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--sans)' }}>Auto</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => {
                    const chars = Array.from(e.target.value);
                    setCustomEmoji(chars[chars.length - 1] || '');
                    setCustomImageUrl('');
                  }}
                  placeholder="ðŸ˜€"
                  style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--hair-strong)', background: 'var(--white)', fontSize: 20, textAlign: 'center', padding: 0 }}
                />
                <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--sans)' }}>or</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: 44, padding: '0 16px', background: 'var(--cream)', border: '1px dashed var(--hair-strong)', borderRadius: 12, fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--sans)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  Upload Image
                </button>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              {(customEmoji || customImageUrl) && (
                <button type="button" onClick={() => { setCustomEmoji(''); setCustomImageUrl(''); }} style={{ fontSize: 10, color: 'var(--red)', background: 'transparent', border: 'none', textAlign: 'left', padding: 0, marginTop: 2 }}>
                  Remove custom icon
                </button>
              )}
            </div>
          </div>
        </Field>
        <Field label="Description (optional)">
          <input className="field-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this link" />
        </Field>
      </div>
      <FormFoot
        onSave={handleSave} onCancel={onClose}
        onDelete={editing && onDelete ? () => onDelete(link!.id) : undefined}
        onArchive={editing ? onArchive : undefined}
        archiveLabel={archiveLabel}
        canSave={!!title.trim() && !!url.trim()} saveLabel={editing ? 'Save' : 'Add link'}
      />
    </FormSheet>
  );
}
