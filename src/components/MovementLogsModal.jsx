import React, { useState, useEffect } from 'react';
import { X, History, Search, Download, ArrowDownRight, ArrowUpRight, Tag, SlidersHorizontal, RefreshCw, Trash2, Edit, Save, Check, Calendar, Package } from 'lucide-react';
import StockAPI from '../api';

const toLocalISOString = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const MovementLogsModal = ({ show, onClose, items = [] }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // State untuk Edit Catatan Job Log
  const [editingMovement, setEditingMovement] = useState(null);
  const [editForm, setEditForm] = useState({
    timestamp: '',
    itemId: '',
    partNumber: '',
    itemName: '',
    brand: '',
    type: 'OUT',
    amount: 1,
    location: '',
    actor: '',
    reference: '',
    notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await StockAPI.getMovements({ search, type: typeFilter });
      setMovements(data || []);
    } catch (err) {
      console.error('Gagal mengambil data Job Log:', err);
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

  const handleStartEdit = (m) => {
    setEditingMovement(m);
    setEditForm({
      timestamp: toLocalISOString(m.timestamp || new Date()),
      itemId: m.itemId || '',
      partNumber: m.partNumber || '',
      itemName: m.itemName || '',
      brand: m.brand || '',
      type: m.type || 'OUT',
      amount: m.amount || 1,
      location: m.location || '',
      actor: m.actor || '',
      reference: m.reference || '',
      notes: m.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMovement) return;

    setSavingEdit(true);
    try {
      const payload = {
        ...editForm,
        timestamp: editForm.timestamp ? new Date(editForm.timestamp).toISOString() : new Date().toISOString()
      };
      const updated = await StockAPI.updateMovement(editingMovement.id, payload);
      if (updated) {
        setMovements((prev) =>
          prev.map((m) => (m.id === editingMovement.id ? { ...m, ...updated } : m))
        );
      }
      setEditingMovement(null);
    } catch (err) {
      console.error('Gagal memperbarui catatan Job Log:', err);
      alert('Gagal memperbarui catatan Job Log.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmMsg = `Hapus catatan Job Log "${item.itemName || 'ini'}" (${item.type} ${item.amount} unit)?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    try {
      await StockAPI.deleteMovement(item.id);
      setMovements((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err) {
      console.error('Gagal menghapus catatan Job Log:', err);
      alert('Gagal menghapus catatan Job Log.');
    } finally {
      setDeletingId(null);
    }
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
    link.setAttribute('download', `Job_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-box" style={{ maxWidth: '980px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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
                Job Log
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Histori aktivitas keluar-masuk barang, serah terima sales/penerima, dan nomor PO
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
                placeholder="Cari di Job Log (nama barang, part number, sales, no PO)..."
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
              title="Refresh Job Log"
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

        {/* Petunjuk Klik untuk Edit */}
        <div style={{
          padding: '0.4rem 0.75rem',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '0.73rem',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Edit size={13} color="#2563EB" />
          <span><strong>Tips:</strong> Klik baris tabel mana pun untuk mengedit catatan jika terjadi kesalahan input (tidak perlu menghapus data).</span>
        </div>

        {/* Tabel Job Log */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '0.25rem', minHeight: '300px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Memuat data Job Log...
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
              <History size={42} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.6 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>Belum ada catatan Job Log</div>
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
                  <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
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
                    <tr
                      key={m.id}
                      onClick={() => handleStartEdit(m)}
                      title="Klik baris untuk edit catatan Job Log ini"
                      style={{ cursor: 'pointer', transition: 'background-color 0.12s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(m);
                            }}
                            title="Edit Catatan Job Log"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2563EB',
                              cursor: 'pointer',
                              padding: '4px 5px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(m);
                            }}
                            disabled={deletingId === m.id}
                            title="Hapus Catatan Ini"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px 5px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                              opacity: deletingId === m.id ? 0.4 : 0.85
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.85'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
            Total: <strong>{movements.length}</strong> catatan Job Log
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Edit Catatan Job Log */}
      {editingMovement && (
        <div
          className="modal-overlay active"
          style={{ zIndex: 1100 }}
          onClick={() => setEditingMovement(null)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Edit Catatan Job Log
                </h3>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748B' }}>
                  Koreksi tanggal transaksi, tipe barang, penerima, atau tujuan barang keluar
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setEditingMovement(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body">
              {/* 1. Tanggal & Waktu Aktivitas */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', marginBottom: '0.35rem' }}>
                  <Calendar size={15} color="#2563EB" /> Tanggal & Waktu Transaksi *
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={editForm.timestamp}
                  onChange={(e) => setEditForm(prev => ({ ...prev, timestamp: e.target.value }))}
                  required
                  style={{ background: '#FFFFFF' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  💡 Ubah tanggal jika barang sebenarnya sudah keluar kemarin tetapi baru sempat diinput hari ini.
                </span>
              </div>

              {/* 2. Tipe Barang / Model / Part Number */}
              <div style={{ background: '#F8FAFC', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: '0.65rem' }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', marginBottom: '0.35rem' }}>
                  <Package size={15} color="#2563EB" /> Tipe Barang / Perangkat *
                </label>
                {items && items.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <select
                      className="form-control"
                      value={editForm.itemId || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selected = items.find(it => String(it.id) === String(selectedId));
                        if (selected) {
                          setEditForm(prev => ({
                            ...prev,
                            itemId: selected.id,
                            itemName: selected.name,
                            partNumber: selected.partNumber || '',
                            brand: selected.brand || prev.brand
                          }));
                        }
                      }}
                      style={{ background: '#FFFFFF', fontSize: '0.8rem' }}
                    >
                      <option value="">-- Pilih dari Daftar Stok (atau ketik manual) --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.brand ? `[${it.brand}] ` : ''}{it.name} {it.partNumber ? `(${it.partNumber})` : ''} - Stok: {it.qty}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Nama Perangkat / Model *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.itemName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, itemName: e.target.value }))}
                      required
                      placeholder="Misal: ThinkPad E14 Gen 4"
                      style={{ background: '#FFFFFF' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Part Number / SKU</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.partNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, partNumber: e.target.value }))}
                      placeholder="Misal: 365K5PA / 21K9000CUS"
                      style={{ background: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tipe Aktivitas & Jumlah Unit */}
              <div className="form-row-2" style={{ marginTop: '0.65rem' }}>
                <div className="form-group">
                  <label>Tipe Aktivitas *</label>
                  <select
                    className="form-control"
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="OUT">Keluar (OUT)</option>
                    <option value="IN">Masuk (IN)</option>
                    <option value="BOOKING">Booking (BOOKING)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah Unit (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 1 }))}
                    required
                  />
                </div>
              </div>

              {/* 4. Lokasi Asal Gudang & Kemana Barang Keluar (Penerima/Sales/Customer) */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Lokasi Asal (Gudang)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Misal: Pallazo (6), IT Talk SBY (1)"
                  />
                </div>
                <div className="form-group">
                  <label>Penerima / Sales / Customer</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.actor}
                    onChange={(e) => setEditForm(prev => ({ ...prev, actor: e.target.value }))}
                    placeholder="Misal: Kak Grace, Mas Fungherry, PT ABC"
                  />
                </div>
              </div>

              {/* 5. Referensi PO & Keterangan Kemana Barang Keluar */}
              <div className="form-group">
                <label>No. PO / Surat Jalan / No. Referensi</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.reference}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Misal: PO-MRDIY-01 / DO-09"
                />
              </div>

              <div className="form-group">
                <label>Tujuan Barang & Catatan Detail</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Misal: Dikirim ke cabang Surabaya untuk project Bank Mandiri..."
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                  Menyimpan history barang tersebut keluar ke mana agar data tercatat rapi dan terstruktur.
                </span>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMovement(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#2563EB', borderColor: '#2563EB' }}
                >
                  <Save size={15} />
                  <span>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementLogsModal;
