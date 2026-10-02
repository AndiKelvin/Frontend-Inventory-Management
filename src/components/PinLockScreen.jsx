import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Lock, Delete, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import StockAPI from '../api';
import './PinLockScreen.css';

export default function PinLockScreen({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const PIN_LENGTH = 6;

  const triggerError = useCallback((message) => {
    setError(message);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
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

  const handleKeyPress = useCallback((digit) => {
    if (isLoading || isSuccess) return;
    if (pin.length < PIN_LENGTH) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === PIN_LENGTH) {
        handleVerify(nextPin);
      }
    }
  }, [pin, isLoading, isSuccess, handleVerify]);

  const handleBackspace = useCallback(() => {
    if (isLoading || isSuccess) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [isLoading, isSuccess]);

  const handleClear = useCallback(() => {
    if (isLoading || isSuccess) return;
    setPin('');
    setError('');
  }, [isLoading, isSuccess]);

  // Listener keyboard fisik (numpad atau angka keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, handleClear]);

  return (
    <div className="pin-lock-overlay">
      <div className={`pin-lock-card ${isShaking ? 'shake' : ''} ${isSuccess ? 'success-pulse' : ''}`}>
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

        {/* Keypad Grid */}
        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="pin-key-btn"
              onClick={() => handleKeyPress(digit)}
              disabled={isLoading || isSuccess}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="pin-key-btn pin-key-action"
            onClick={handleClear}
            disabled={isLoading || isSuccess || pin.length === 0}
            title="Hapus Semua (Escape)"
          >
            C
          </button>
          <button
            type="button"
            className="pin-key-btn"
            onClick={() => handleKeyPress('0')}
            disabled={isLoading || isSuccess}
          >
            0
          </button>
          <button
            type="button"
            className="pin-key-btn pin-key-action"
            onClick={handleBackspace}
            disabled={isLoading || isSuccess || pin.length === 0}
            title="Hapus Satu Digit (Backspace)"
          >
            <Delete size={17} />
          </button>
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
