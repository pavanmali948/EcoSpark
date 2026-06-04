import React from 'react';
import { X } from 'lucide-react';

export default function PopupMessage({
  open,
  title = 'Message',
  message = '',
  variant = 'info', // info | success | error
  onClose,
}) {
  if (!open) return null;

  const styles =
    variant === 'success'
      ? {
          wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          accent: 'bg-emerald-600',
        }
      : variant === 'error'
        ? {
            wrapper: 'bg-red-50 border-red-200 text-red-800',
            accent: 'bg-red-600',
          }
        : {
            wrapper: 'bg-blue-50 border-blue-200 text-blue-800',
            accent: 'bg-blue-600',
          };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative max-w-lg w-full rounded-2xl border ${styles.wrapper} shadow-xl`}>
        <div className="flex items-start justify-between gap-4 p-4 border-b border-black/5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${styles.accent}`} />
              <h3 className="font-semibold text-base">{title}</h3>
            </div>
            {message && <p className="mt-2 text-sm leading-relaxed break-words">{message}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

