import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import StockAPI from '../../api';
import './PinLockScreen.css';

export default function PinLockScreen({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef(null);

  const PIN_LENGTH = 6;

  const triggerError = useCallback((message) => {
    setError(message);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
      inputRef.current?.focus();
    }, 450);
  }, []);

  const handleVerify = useCallback(async (pinToVerify) => {
    if (isLoading || isSuccess) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await StockAPI.verifyPin(pinToVerify);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onAuthenticated(res.token);
        }, 350);
      } else {
        triggerError(res.error || 'PIN salah');
      }
    } catch {
      triggerError('Gagal verifikasi');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isSuccess, onAuthenticated, triggerError]);

  const handleInputChange = (e) => {
    if (isLoading || isSuccess) return;
    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(cleanVal);
    setError('');
    if (cleanVal.length === PIN_LENGTH) {
      handleVerify(cleanVal);
    }
  };

  // Auto-focus input saat pertama kali dimuat
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listener keyboard fisik (numpad atau angka keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLoading || isSuccess) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setError('');
        return;
      }

      // Pastikan input tetap fokus jika user mengetik angka dari keyboard fisik
      if (inputRef.current && document.activeElement !== inputRef.current) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          inputRef.current.focus();
          const next = (pin + e.key).slice(0, PIN_LENGTH);
          setPin(next);
          setError('');
          if (next.length === PIN_LENGTH) {
            handleVerify(next);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLoading, isSuccess, handleVerify]);

  return (
    <div className="pin-lock-overlay" onClick={() => inputRef.current?.focus()}>
      <div 
        className={`pin-lock-card ${isShaking ? 'shake' : ''} ${isSuccess ? 'success-pulse' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
      >
        {/* Input untuk menangkap ketikan keyboard perangkat (termasuk virtual keyboard HP/tablet) */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={handleInputChange}
          autoFocus
          className="pin-hidden-input"
          disabled={isLoading || isSuccess}
          autoComplete="one-time-code"
          aria-label="PIN Keamanan 6 Digit"
        />

        {/* Header & Logo */}
        <div className="pin-lock-header">
          <div className="pin-lock-icon-wrapper">
            {isSuccess ? (
              <CheckCircle2 size={20} className="pin-status-icon text-success" />
            ) : (
              <Lock size={18} className="pin-status-icon text-primary" />
            )}
          </div>
          <h2 className="pin-lock-title">Daftar Stok Berjalan</h2>
          <p className="pin-lock-subtitle">Concordia Group</p>
        </div>

        {/* Security Badge */}
        <div className="pin-security-badge">
          <KeyRound size={12} />
          <span>Masukkan PIN 6 Digit</span>
        </div>

        {/* PIN Indicators Dots */}
        <div className="pin-dots-container" aria-label="PIN Indicator">
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const isFilled = idx < pin.length;
            const isCurrent = idx === pin.length && !isSuccess;
            return (
              <div
                key={idx}
                className={`pin-dot ${isFilled ? 'filled' : ''} ${isCurrent ? 'active' : ''} ${isSuccess ? 'dot-success' : ''}`}
              />
            );
          })}
        </div>

        {/* Error / Loading Feedback */}
        <div className="pin-feedback-container">
          {error && (
            <div className="pin-error-banner">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}
          {isLoading && (
            <div className="pin-loading-banner">
              <div className="pin-spinner" />
              <span>Memverifikasi...</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pin-lock-footer">
          <ShieldCheck size={12} />
          <span>Keamanan Sesi Terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
