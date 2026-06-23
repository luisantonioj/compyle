import React from 'react';
import { createPortal } from 'react-dom';

export function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {children}
      </div>
    </>,
    document.body
  );
}

// Partner banner
