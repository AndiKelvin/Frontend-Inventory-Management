import React, { useState, useEffect } from 'react';
import { X, History, Search, Download, ArrowDownRight, ArrowUpRight, Tag, SlidersHorizontal, RefreshCw } from 'lucide-react';
import StockAPI from '../api';

const MovementLogsModal = ({ show, onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await StockAPI.getMovements({ search, type: typeFilter });
      setMovements(data || []);
    } catch (err) {
      console.error('Gagal mengambil data mutasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchMovements();
    }
  }, [show, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovements();
  };

  const handleExportCSV = () => {
    if (!movements || movements.length === 0) return;

    const headers = ['ID', 'Waktu', 'Tipe', 'Brand', 'Part Number', 'Nama Barang', 'Jumlah', 'Sisa Stok', 'Lokasi', 'Penerima / Sales', 'No PO / Ref', 'Catatan'];
    const rows = movements.map((m) => [
      `"${m.id || ''}"`,
      `"${m.timestamp ? new Date(m.timestamp).toLocaleString('id-ID') : ''}"`,
      `"${m.type || ''}"`,
      `"${m.brand || ''}"`,
      `"${m.partNumber || ''}"`,
      `"${(m.itemName || '').replace(/"/g, '""')}"`,
      m.amount || 0,
      m.newQty !== null && m.newQty !== undefined ? m.newQty : '',
      `"${(m.location || '').replace(/"/g, '""')}"`,
      `"${(m.actor || '').replace(/"/g, '""')}"`,
      `"${(m.reference || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Mutasi_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-box" style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Modal */}
        <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#EFF6FF',
              color: '#2563EB',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Riwayat Mutasi & Audit Stok
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Histori keluar-masuk barang, serah terima sales/penerima, dan nomor PO
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Tutup"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Search, Filter Tabs, Export */}
        <div style={{
          padding: '0.85rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9'
        }}>
          {/* Form Pencarian */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem', flex: '1 1 280px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Cari nama barang, part number, sales, no PO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem 0.45rem 2rem',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  outline: 'none'
                }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
              Cari
            </button>
          </form>

          {/* Filter Tipe Mutasi & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: typeFilter === 'all' ? '#FFFFFF' : 'transparent',
                  color: typeFilter === 'all' ? '#0F172A' : '#64748B',
                  boxShadow: typeFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('OUT')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: typeFilter === 'OUT' ? '#FEE2E2' : 'transparent',
                  color: typeFilter === 'OUT' ? '#DC2626' : '#64748B'
                }}
              >
                Keluar (OUT)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('IN')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: typeFilter === 'IN' ? '#DCFCE7' : 'transparent',
                  color: typeFilter === 'IN' ? '#16A34A' : '#64748B'
                }}
              >
                Masuk (IN)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('BOOKING')}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  background: typeFilter === 'BOOKING' ? '#FEF3C7' : 'transparent',
                  color: typeFilter === 'BOOKING' ? '#D97706' : '#64748B'
                }}
              >
                Booking
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMovements}
              title="Refresh Riwayat"
              style={{
                padding: '0.45rem',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                background: '#FFFFFF',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <RefreshCw size={14} />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={movements.length === 0}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Download size={14} />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Tabel Riwayat Mutasi */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '0.5rem', minHeight: '300px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Memuat data riwayat mutasi...
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
              <History size={42} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.6 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>Belum ada catatan mutasi</div>
              <p style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '0.35rem auto 0' }}>
                Setiap kali Anda menambah, mengurangi stok via tombol [-] / [+], atau melakukan booking, catatan historis akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <table className="compact-stock-table" style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '135px' }}>Waktu</th>
                  <th style={{ width: '95px', textAlign: 'center' }}>Tipe</th>
                  <th>Nama Perangkat & Part ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Jumlah</th>
                  <th style={{ width: '120px' }}>Lokasi</th>
                  <th style={{ width: '130px' }}>Penerima / Sales</th>
                  <th style={{ width: '110px' }}>No. PO / Ref</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isOut = m.type === 'OUT';
                  const isIn = m.type === 'IN';
                  const isBooking = m.type === 'BOOKING';

                  let typeBadgeBg = '#F1F5F9';
                  let typeBadgeColor = '#475569';
                  let typeIcon = <SlidersHorizontal size={12} />;

                  if (isOut) {
                    typeBadgeBg = '#FEE2E2';
                    typeBadgeColor = '#DC2626';
                    typeIcon = <ArrowDownRight size={12} />;
                  } else if (isIn) {
                    typeBadgeBg = '#DCFCE7';
                    typeBadgeColor = '#16A34A';
                    typeIcon = <ArrowUpRight size={12} />;
                  } else if (isBooking) {
                    typeBadgeBg = '#FEF3C7';
                    typeBadgeColor = '#D97706';
                    typeIcon = <Tag size={12} />;
                  }

                  const formattedDate = m.timestamp
                    ? new Intl.DateTimeFormat('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(m.timestamp))
                    : '-';

                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.74rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 7px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: typeBadgeBg,
                          color: typeBadgeColor
                        }}>
                          {typeIcon}
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.25 }}>
                          {m.itemName || '-'}
                        </div>
                        {m.partNumber && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            color: '#0284C7',
                            fontWeight: 600
                          }}>
                            {m.partNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: isOut ? '#DC2626' : (isIn ? '#16A34A' : '#2563EB') }}>
                          {isOut ? `-${m.amount}` : (isIn ? `+${m.amount}` : m.amount)} unit
                        </span>
                        {m.newQty !== null && m.newQty !== undefined && (
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 400 }}>
                            Sisa: {m.newQty}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#334155' }}>
                        {m.location || '-'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1E293B' }}>
                        {m.actor && m.actor !== '-' ? (
                          <span style={{ background: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                            👤 {m.actor}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: '#475569' }}>
                        {m.reference && m.reference !== '-' ? m.reference : '-'}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.74rem' }}>
                        {m.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
            Total: <strong>{movements.length}</strong> catatan riwayat mutasi
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovementLogsModal;
