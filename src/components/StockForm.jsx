import React, { useState, useEffect } from 'react';
import { X, Check, UserCheck, Plus, Trash2, AlertCircle } from 'lucide-react';
import { parseNotesAndMapping, formatNotesAndMapping } from '../utils/stockUtils';

const StockForm = ({ show, item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    brand: 'DELL',
    partNumber: '',
    name: '',
    category: 'laptop',
    cpu: '',
    ram: '',
    storage: '',
    qty: 1,
    location: ''
  });

  // State terpisah untuk Keterangan dan Mapping
  const [keterangan, setKeterangan] = useState('');
  const [mappings, setMappings] = useState([]);

  // State form input mapping sales baru
  const [showMappingInput, setShowMappingInput] = useState(false);
  const [salesNameInput, setSalesNameInput] = useState('');
  const [salesQtyInput, setSalesQtyInput] = useState(1);
  const [projectNoteInput, setProjectNoteInput] = useState('');
  const [mappingError, setMappingError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id || '',
        brand: item.brand || 'DELL',
        partNumber: item.partNumber || '',
        name: item.name || '',
        category: item.category || 'laptop',
        cpu: item.cpu || '',
        ram: item.ram || '',
        storage: item.storage || '',
        qty: item.qty || 0,
        location: item.location || ''
      });

      const { mappings: parsedMappings, keterangan: parsedKeterangan } = parseNotesAndMapping(item.notes || '');
      setMappings(parsedMappings);
      setKeterangan(parsedKeterangan);
    } else {
      setFormData({
        id: '', brand: 'DELL', partNumber: '', name: '', category: 'laptop',
        cpu: '', ram: '', storage: '', qty: 1, location: ''
      });
      setMappings([]);
      setKeterangan('');
    }

    setShowMappingInput(false);
    setSalesNameInput('');
    setSalesQtyInput(1);
    setProjectNoteInput('');
    setMappingError('');
  }, [item, show]);

  if (!show) return null;

  const currentTotalQty = parseInt(formData.qty, 10) || 0;
  const totalMapped = mappings.reduce((sum, m) => sum + (parseInt(m.qty, 10) || 0), 0);
  const readyBebas = Math.max(0, currentTotalQty - totalMapped);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMapping = () => {
    const name = salesNameInput.trim();
    const qty = parseInt(salesQtyInput, 10) || 0;

    if (!name) {
      setMappingError('Nama sales wajib diisi.');
      return;
    }
    if (qty <= 0) {
      setMappingError('Jumlah barang mapping minimal 1 unit.');
      return;
    }
    if (qty > readyBebas) {
      setMappingError(`Jumlah melebihi sisa stok ready bebas (${readyBebas} unit).`);
      return;
    }

    setMappings(prev => [
      ...prev,
      {
        id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sales: name,
        qty,
        note: projectNoteInput.trim()
      }
    ]);

    setSalesNameInput('');
    setSalesQtyInput(1);
    setProjectNoteInput('');
    setMappingError('');
    setShowMappingInput(false);
  };

  const handleRemoveMapping = (id) => {
    setMappings(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalMapped > currentTotalQty) {
      alert(`Total unit yang di-mapping (${totalMapped}) melebihi jumlah stok tersedia (${currentTotalQty}). Sesuaikan kembali mapping sales.`);
      return;
    }

    const combinedNotes = formatNotesAndMapping(mappings, keterangan);
    const unitObj = {
      ...formData,
      id: formData.id || `custom-${Date.now()}`,
      qty: currentTotalQty,
      notes: combinedNotes,
      status: currentTotalQty > 0 ? 'ready' : 'sold',
      updatedAt: new Date().toISOString()
    };
    
    onSave(unitObj);
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3>{item ? "Edit Data Barang Stok" : "Tambah Barang ke Daftar Stok"}</h3>
          <button type="button" className="btn-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label>Brand / Merk *</label>
              <select name="brand" className="form-control" value={formData.brand} onChange={handleChange} required>
                <option value="DELL">DELL</option>
                <option value="HP">HP</option>
                <option value="DELL LAINNYA">DELL LAINNYA (Stok Lama)</option>
                <option value="Lenovo">Lenovo</option>
                <option value="ASUS">ASUS</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group">
              <label>Part Number / Part ID *</label>
              <input type="text" name="partNumber" className="form-control" value={formData.partNumber} onChange={handleChange} placeholder="Misal: GA3440I7V1 atau 446J7PA" required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Nama Perangkat & Tipe Model *</label>
              <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} placeholder="Misal: Latitude 3440-i71355U-16GB-512GB" required />
            </div>
            <div className="form-group">
              <label>Kategori Perangkat *</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                <option value="laptop">Laptop / Notebook</option>
                <option value="pc-desktop">PC Desktop / Tower</option>
                <option value="pc-mini">Mini PC / Micro</option>
                <option value="aio">All-in-One (AIO)</option>
                <option value="server">Server / Workstation</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Processor (CPU) *</label>
              <input type="text" name="cpu" className="form-control" value={formData.cpu} onChange={handleChange} placeholder="Misal: Intel Core i5-1235U" required />
            </div>
            <div className="form-group">
              <label>RAM *</label>
              <input type="text" name="ram" className="form-control" value={formData.ram} onChange={handleChange} placeholder="Misal: 16GB / 8GB" required />
            </div>
            <div className="form-group">
              <label>Storage *</label>
              <input type="text" name="storage" className="form-control" value={formData.storage} onChange={handleChange} placeholder="Misal: 512GB SSD / 1TB HDD" required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Jumlah Stok Tersedia *</label>
              <input type="number" name="qty" className="form-control" min="0" value={formData.qty} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Lokasi Penyimpanan (Gudang)</label>
              <input type="text" name="location" className="form-control" value={formData.location} onChange={handleChange} placeholder="Misal: Pallazo (6), IT Talk Ambas (1)" />
            </div>
          </div>

          {/* Section Keterangan Umum (Terpisah dari Mapping) */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Catatan & Keterangan Barang</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 'normal' }}>Catatan kondisi / spesifikasi (Bukan untuk mapping)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Misal: Unit segel, Dus bagus, Garansi resmi 3 tahun (opsional)"
            />
          </div>

          {/* Section Alokasi Booking / Mapping Sales (Terpisah & Rapi) */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <UserCheck size={16} color="#2563EB" />
                <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1E293B' }}>
                  Alokasi Mapping / Booking Sales
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowMappingInput(!showMappingInput);
                  setMappingError('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  padding: '4px 9px',
                  background: showMappingInput ? '#EEF2F6' : '#EFF6FF',
                  color: '#1D4ED8',
                  borderColor: '#BFDBFE',
                  fontWeight: 600
                }}
              >
                <Plus size={14} />
                <span>Button Mapping</span>
              </button>
            </div>

            {/* Indikator Stok: Total Stok, Di-Mapping, dan Ready Bebas */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.75rem',
              fontSize: '0.74rem'
            }}>
              <span style={{ background: '#E2E8F0', color: '#334155', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                Total Stok: {currentTotalQty} unit
              </span>
              <span style={{ background: totalMapped > 0 ? '#FEF3C7' : '#F1F5F9', color: totalMapped > 0 ? '#B45309' : '#64748B', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                🔒 Di-Mapping: {totalMapped} unit
              </span>
              <span style={{ background: readyBebas > 0 ? '#DCFCE7' : '#FEE2E2', color: readyBebas > 0 ? '#15803D' : '#DC2626', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                ✓ Ready Bebas: {readyBebas} unit
              </span>
            </div>

            {/* Panel Input Mapping Baru jika Button Mapping diklik */}
            {showMappingInput && (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '0.7rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.45rem' }}>
                  Form Input Mapping Sales:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      Nama Sales Siapa *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ padding: '4px 7px', fontSize: '0.78rem' }}
                      value={salesNameInput}
                      onChange={(e) => setSalesNameInput(e.target.value)}
                      placeholder="Misal: Kak Grace, Kak Pipit"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      Barang Berapa *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, readyBebas)}
                      className="form-control"
                      style={{ padding: '4px 7px', fontSize: '0.78rem', textAlign: 'center' }}
                      value={salesQtyInput}
                      onChange={(e) => setSalesQtyInput(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      Project / Klien (Opsional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ padding: '4px 7px', fontSize: '0.78rem' }}
                      value={projectNoteInput}
                      onChange={(e) => setProjectNoteInput(e.target.value)}
                      placeholder="Misal: MR DIY / Tunggu PO"
                    />
                  </div>
                </div>

                {mappingError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626', fontSize: '0.72rem', marginBottom: '0.45rem' }}>
                    <AlertCircle size={13} />
                    <span>{mappingError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMappingInput(false);
                      setMappingError('');
                    }}
                    style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddMapping}
                    style={{ fontSize: '0.74rem', padding: '3px 10px', background: '#2563EB', borderColor: '#2563EB' }}
                  >
                    Simpan Mapping
                  </button>
                </div>
              </div>
            )}

            {/* Daftar Mapping Aktif */}
            {mappings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                  Daftar Sales yang Mapping ({mappings.length}):
                </div>
                {mappings.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{m.sales}</span>
                      <span style={{
                        background: '#FEF3C7',
                        color: '#B45309',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}>
                        {m.qty} unit
                      </span>
                      {m.note && (
                        <span style={{ color: '#64748B', fontSize: '0.72rem' }}>
                          ({m.note})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMapping(m.id)}
                      title="Hapus mapping ini"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontStyle: 'italic' }}>
                Tidak ada alokasi mapping aktif. Klik <strong>Button Mapping</strong> jika ada sales yang ingin hold barang.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockForm;

