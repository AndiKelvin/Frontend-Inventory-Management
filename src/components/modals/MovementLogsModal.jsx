import React, { useState, useEffect, useRef } from 'react';
import { X, History, Search, Download, ArrowDownRight, ArrowUpRight, Tag, SlidersHorizontal, RefreshCw, Trash2, Edit, Save, Check, Calendar, Package, ChevronDown, Building2, AlertCircle } from 'lucide-react';
import StockAPI from '../../api';
import ConfirmDialog from '../common/ConfirmDialog';

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
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [modalFeedback, setModalFeedback] = useState(null);

  // State untuk Edit Catatan History
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

  // State untuk data Customer & Sales pada edit modal
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);

  const editSalesRef = useRef(null);
  const editCustomerRef = useRef(null);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await StockAPI.getMovements({ search, type: typeFilter });
      setMovements(data || []);
    } catch (err) {
      console.error('Gagal mengambil data History:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchMovements();
      StockAPI.getCustomers().then(data => {
        if (Array.isArray(data)) setCustomers(data);
      });
      StockAPI.getSales().then(data => {
        if (Array.isArray(data)) setSalesList(data);
      });
    }
  }, [show, typeFilter]);

  // Shortcut tombol Esc untuk menutup modal / sub-modal edit
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCustomerDropdown || showSalesDropdown) {
          setShowCustomerDropdown(false);
          setShowSalesDropdown(false);
        } else if (editingMovement) {
          setEditingMovement(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, showCustomerDropdown, showSalesDropdown, editingMovement, onClose]);

  // Click outside listener untuk dropdown di edit modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editSalesRef.current && !editSalesRef.current.contains(e.target)) {
        setShowSalesDropdown(false);
      }
      if (editCustomerRef.current && !editCustomerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const matched = customers.find(c => (c.companyName || '').toLowerCase() === (m.notes || '').toLowerCase().trim());
    setSelectedCustomerDetail(matched || null);
    setShowSalesDropdown(false);
    setShowCustomerDropdown(false);
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
      setModalFeedback({ type: 'success', text: '✓ Catatan History berhasil diperbarui.' });
      setTimeout(() => setModalFeedback(null), 3000);
    } catch (err) {
      console.error('Gagal memperbarui catatan History:', err);
      setModalFeedback({ type: 'error', text: 'Gagal memperbarui catatan History.' });
      setTimeout(() => setModalFeedback(null), 3000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteConfirmItem(item);
  };

  const confirmDeleteLog = async () => {
    if (!deleteConfirmItem) return;
    const item = deleteConfirmItem;
    setDeleteConfirmItem(null);

    setDeletingId(item.id);
    try {
      await StockAPI.deleteMovement(item.id);
      setMovements((prev) => prev.filter((m) => m.id !== item.id));
      setModalFeedback({ type: 'success', text: '✓ Catatan History berhasil dihapus.' });
      setTimeout(() => setModalFeedback(null), 3000);
    } catch (err) {
      console.error('Gagal menghapus catatan History:', err);
      setModalFeedback({ type: 'error', text: 'Gagal menghapus catatan History.' });
      setTimeout(() => setModalFeedback(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!movements || movements.length === 0) return;

    const headers = ['ID', 'Waktu', 'Tipe', 'Brand', 'Part Number', 'Nama Barang', 'Jumlah', 'Sisa Stok', 'Lokasi', 'Penerima / Sales', 'No PO / Ref', 'Customer'];
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
    link.setAttribute('download', `History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter daftar sales sesuai input di edit modal
  const filteredSales = salesList.filter(s => {
    if (!editForm.actor) return true;
    return s.toLowerCase().includes(editForm.actor.toLowerCase().trim());
  });

  // Filter database customer sesuai pencarian di edit modal
  const filteredCustomers = customers.filter(c => {
    if (!editForm.notes) return true;
    const q = editForm.notes.toLowerCase().trim();
    return (
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.contactName && c.contactName.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }).slice(0, 30);

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
                History
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
                placeholder="Cari di History (nama barang, part number, sales, no PO)..."
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
            <div className="filter-type-group">
              <button
                type="button"
                className={`btn-type-filter ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`btn-type-filter filter-out ${typeFilter === 'OUT' ? 'active' : ''}`}
                onClick={() => setTypeFilter('OUT')}
              >
                Keluar (OUT)
              </button>
              <button
                type="button"
                className={`btn-type-filter filter-in ${typeFilter === 'IN' ? 'active' : ''}`}
                onClick={() => setTypeFilter('IN')}
              >
                Masuk (IN)
              </button>
              <button
                type="button"
                className={`btn-type-filter filter-booking ${typeFilter === 'BOOKING' ? 'active' : ''}`}
                onClick={() => setTypeFilter('BOOKING')}
              >
                Booking
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMovements}
              title="Refresh History"
              className="btn btn-secondary"
              style={{ padding: '0.45rem', fontSize: '0.8rem' }}
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
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-default)',
          fontSize: '0.73rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Edit size={13} color="var(--border-focus)" />
          <span><strong>Tips:</strong> Klik baris tabel mana pun untuk mengedit catatan jika terjadi kesalahan input (tidak perlu menghapus data).</span>
        </div>

        {/* Tabel History */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '0.25rem', minHeight: '300px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Memuat data History...
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
              <History size={42} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.6 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>Belum ada catatan History</div>
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
                  <th>Customer</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isOut = m.type === 'OUT';
                  const isIn = m.type === 'IN';
                  const isBooking = m.type === 'BOOKING';

                  let typeIcon = <SlidersHorizontal size={12} />;

                  if (isOut) {
                    typeIcon = <ArrowDownRight size={12} />;
                  } else if (isIn) {
                    typeIcon = <ArrowUpRight size={12} />;
                  } else if (isBooking) {
                    typeIcon = <Tag size={12} />;
                  }

                  const typeClass = isOut ? 'type-badge-out' : (isIn ? 'type-badge-in' : (isBooking ? 'type-badge-booking' : 'type-badge-default'));

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
                      title="Klik baris untuk edit catatan History ini"
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`type-badge ${typeClass}`}>
                          {typeIcon}
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                          {m.itemName || '-'}
                        </div>
                        {m.partNumber && (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            color: 'var(--dell-primary)',
                            fontWeight: 600
                          }}>
                            {m.partNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: isOut ? 'var(--red-critical)' : (isIn ? 'var(--ready-green)' : 'var(--dell-primary)') }}>
                          {isOut ? `-${m.amount}` : (isIn ? `+${m.amount}` : m.amount)} unit
                        </span>
                        {m.newQty !== null && m.newQty !== undefined && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            Sisa: {m.newQty}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {m.location || '-'}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.actor && m.actor !== '-' ? (
                          <span style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                            👤 {m.actor}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {m.reference && m.reference !== '-' ? m.reference : '-'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
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
                            title="Edit Catatan History"
                            className="btn-row-action"
                            style={{ width: '26px', height: '26px' }}
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(m);
                            }}
                            disabled={deletingId === m.id}
                            title="Hapus Catatan Ini"
                            className="btn-row-action delete"
                            style={{ width: '26px', height: '26px' }}
                          >
                            <Trash2 size={13} />
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
            Total: <strong>{movements.length}</strong> catatan History
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Edit Catatan History */}
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
                  Edit Catatan History
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
                {/* Kolom Sales dengan Filter & Search Dropdown */}
                <div className="form-group" ref={editSalesRef} style={{ position: 'relative' }}>
                  <label>Penerima / Sales</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.actor}
                      onFocus={() => setShowSalesDropdown(true)}
                      onChange={(e) => {
                        setEditForm(prev => ({ ...prev, actor: e.target.value }));
                        setShowSalesDropdown(true);
                      }}
                      placeholder="Cari / ketik nama sales..."
                      style={{ paddingRight: '1.8rem', background: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSalesDropdown(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#64748B'
                      }}
                      title="Lihat daftar sales"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Dropdown Hasil Pencarian Sales */}
                  {showSalesDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '160px',
                      overflowY: 'auto',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      zIndex: 1200,
                      marginTop: '3px'
                    }}>
                      {filteredSales.length === 0 ? (
                        <div style={{ padding: '6px 10px', fontSize: '0.74rem', color: '#94A3B8' }}>
                          Tekan simpan untuk sales baru ini
                        </div>
                      ) : (
                        filteredSales.map((salesName, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setEditForm(prev => ({ ...prev, actor: salesName }));
                              setShowSalesDropdown(false);
                            }}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #F8FAFC',
                              color: '#1E293B',
                              fontWeight: editForm.actor === salesName ? 700 : 500,
                              background: editForm.actor === salesName ? '#EFF6FF' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = editForm.actor === salesName ? '#EFF6FF' : '#FFFFFF'; }}
                          >
                            <span>👤</span>
                            <span>{salesName}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Referensi PO & Customer */}
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

              {/* Kolom Customer dengan Filter & Pencarian Database Neon */}
              <div className="form-group" ref={editCustomerRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>
                    Customer
                  </label>
                  {customers.length > 0 && (
                    <span style={{ fontSize: '0.67rem', color: '#0284C7', background: '#F0F9FF', padding: '1px 6px', borderRadius: '4px', border: '1px solid #BAE6FD', fontWeight: 600 }}>
                      ⚡ {customers.length} Customer di Database
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.notes}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setEditForm(prev => ({ ...prev, notes: e.target.value }));
                      setShowCustomerDropdown(true);
                      setSelectedCustomerDetail(null);
                    }}
                    placeholder="Ketik nama perusahaan untuk mencari di database..."
                    style={{ paddingRight: '1.8rem', background: '#FFFFFF' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerDropdown(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748B'
                    }}
                    title="Buka / tutup list customer"
                  >
                    <Search size={14} />
                  </button>
                </div>

                {/* Rangkuman Detail Info Customer yang Sedang Dipilih */}
                {selectedCustomerDetail && (
                  <div style={{
                    marginTop: '4px',
                    padding: '5px 8px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '5px',
                    fontSize: '0.71rem',
                    color: '#166534',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {selectedCustomerDetail.contactName && (
                      <span>👤 <strong>PIC:</strong> {selectedCustomerDetail.contactName}</span>
                    )}
                    {selectedCustomerDetail.phone && (
                      <span>📞 <strong>Telp:</strong> {selectedCustomerDetail.phone}</span>
                    )}
                    {selectedCustomerDetail.address && (
                      <span>📍 <strong>Alamat:</strong> {selectedCustomerDetail.address}</span>
                    )}
                  </div>
                )}

                {/* Dropdown Pencarian Customer Real-Time */}
                {showCustomerDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '190px',
                    overflowY: 'auto',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    zIndex: 1200,
                    marginTop: '3px'
                  }}>
                    {filteredCustomers.length === 0 ? (
                      <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94A3B8' }}>
                        Tidak ditemukan perusahaan &quot;{editForm.notes}&quot; (akan disimpan sebagai nama baru)
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setEditForm(prev => ({ ...prev, notes: c.companyName }));
                            setSelectedCustomerDetail(c);
                            setShowCustomerDropdown(false);
                          }}
                          style={{
                            padding: '7px 10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F1F5F9',
                            background: editForm.notes === c.companyName ? '#EFF6FF' : '#FFFFFF'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = editForm.notes === c.companyName ? '#EFF6FF' : '#FFFFFF'; }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Building2 size={13} color="#2563EB" />
                            <span>{c.companyName}</span>
                          </div>
                          {(c.address || c.contactName || c.phone) && (
                            <div style={{ fontSize: '0.69rem', color: '#64748B', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {c.contactName && <span>👤 PIC: {c.contactName}</span>}
                              {c.phone && <span>📞 {c.phone}</span>}
                              {c.address && <span>📍 {c.address.length > 40 ? `${c.address.substring(0, 40)}...` : c.address}</span>}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
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

      {/* Modal Feedback Toast */}
      {modalFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: modalFeedback.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${modalFeedback.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
          color: modalFeedback.type === 'error' ? '#DC2626' : '#15803D',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {modalFeedback.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{modalFeedback.text}</span>
        </div>
      )}

      {/* Confirm Dialog Hapus History */}
      <ConfirmDialog
        show={!!deleteConfirmItem}
        title="Hapus Catatan History?"
        message={`Apakah Anda yakin ingin menghapus catatan mutasi "${deleteConfirmItem?.itemName || 'Unit'}" (${deleteConfirmItem?.type} ${deleteConfirmItem?.amount} unit)? Tindakan ini akan menghapus data audit mutasi secara permanen.`}
        confirmText="Ya, Hapus Catatan"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDeleteLog}
        onClose={() => setDeleteConfirmItem(null)}
      />
    </div>
  );
};

export default MovementLogsModal;
