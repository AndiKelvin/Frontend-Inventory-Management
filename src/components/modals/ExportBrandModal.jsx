import React from 'react';
import { X, Image, ArrowRight, Building2, Download } from 'lucide-react';

const ExportBrandModal = ({
  show,
  exportType,
  onClose,
  onSelectBrand,
  onSelectExcelBrand,
  isExporting
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box export-brand-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                background: exportType === 'SMB' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                color: exportType === 'SMB' ? '#3B82F6' : '#A855F7',
                borderRadius: '8px',
                padding: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${exportType === 'SMB' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
              }}
            >
              <Image size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Export Gambar {exportType}
                </h3>
                <span
                  style={{
                    background: '#10B981',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}
                >
                  FORMAT .JPG
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                {exportType === 'SMB'
                  ? 'Output gambar JPG beresolusi tinggi tanpa warna untuk daily report ke grup internal:'
                  : 'Output gambar JPG beresolusi tinggi sesuai format laporan resmi untuk report PIC:'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            disabled={isExporting}
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Pilihan Brand */}
        <div className="modal-body" style={{ padding: '1.25rem 1.4rem' }}>
          <div className="export-brand-cards">
            {/* Card HP */}
            <div
              role="button"
              tabIndex={0}
              className={`brand-export-card hp-export-card ${isExporting ? 'disabled' : ''}`}
              onClick={() => !isExporting && onSelectBrand('hp')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isExporting && onSelectBrand('hp')}
            >
              <div className="brand-export-card-header">
                <span className="brand-pill hp">HP</span>
                <span className="brand-export-company">
                  <Building2 size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  PT Projectindo Teknowindata
                </span>
              </div>
              <div className="brand-export-card-content">
                <h4 className="brand-export-title">Hewlett-Packard (HP)</h4>
                <p className="brand-export-desc">
                  {exportType === 'SMB'
                    ? 'Tarik data stok HP dari urutan no. 2 - 4 (446J7PA, 8M0Y9PA, 9J086PT). No. 1, 5-7, dan 8 otomatis dilewati.'
                    : 'Format laporan Distri HP 7 kolom dengan logo HP, rincian distributor, breakdown lokasi, dan baris total.'}
                </p>
              </div>
              <div className="brand-export-btn-action hp-action">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Download size={14} /> Unduh Gambar JPG (HP)
                </span>
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card Dell */}
            <div
              role="button"
              tabIndex={0}
              className={`brand-export-card dell-export-card ${isExporting ? 'disabled' : ''}`}
              onClick={() => !isExporting && onSelectBrand('dell')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isExporting && onSelectBrand('dell')}
            >
              <div className="brand-export-card-header">
                <span className="brand-pill dell">DELL</span>
                <span className="brand-export-company">
                  <Building2 size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  PT. Global Solusindo Kompudata
                </span>
              </div>
              <div className="brand-export-card-content">
                <h4 className="brand-export-title">Dell & Dell Lainnya</h4>
                <p className="brand-export-desc">
                  {exportType === 'SMB'
                    ? 'Gabungan Dell & Dell Lainnya (unit dengan sisa stok 1 otomatis tidak diinput).'
                    : 'Format laporan Distri Dell 6 kolom dengan logo Dell, group Latitude & Optiplex, dan breakdown lokasi.'}
                </p>
              </div>
              <div className="brand-export-btn-action dell-action">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Download size={14} /> Unduh Gambar JPG (Dell)
                </span>
                <ArrowRight size={15} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Butuh file Excel?</span>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '3px 8px',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)'
              }}
              onClick={() => onSelectExcelBrand && onSelectExcelBrand('hp')}
              title="Unduh format Excel HP"
            >
              Excel HP
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '3px 8px',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)'
              }}
              onClick={() => onSelectExcelBrand && onSelectExcelBrand('dell')}
              title="Unduh format Excel Dell"
            >
              Excel Dell
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isExporting}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportBrandModal;
