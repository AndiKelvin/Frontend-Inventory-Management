import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

export default function ConfirmDialog({
  show,
  title = 'Konfirmasi',
  message = '',
  type = 'danger', // 'danger' | 'warning' | 'info'
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isAlert = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onConfirm, onClose]);

  if (!show) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      className="modal-overlay active"
      style={{
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-floating)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: isDanger ? 'var(--red-surface)' : isWarning ? 'var(--amber-surface)' : 'var(--dell-surface)',
              color: isDanger ? 'var(--red-critical)' : isWarning ? 'var(--amber-warning)' : 'var(--dell-primary)',
              border: `1px solid ${isDanger ? 'var(--red-border)' : isWarning ? 'var(--amber-border)' : 'var(--dell-border)'}`,
            }}
          >
            {isDanger ? <Trash2 size={22} /> : isWarning ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '2px',
                  display: 'flex',
                  borderRadius: '6px',
                }}
                title="Tutup (Escape)"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '0.9rem 1.5rem',
            background: 'var(--bg-subtle)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
          }}
        >
          {!isAlert && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 1.15rem',
              borderRadius: '8px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: isDanger ? '#DC2626' : isWarning ? '#D97706' : '#2563EB',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isDanger ? '0 2px 4px rgba(220, 38, 38, 0.2)' : '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
