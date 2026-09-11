import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

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
    location: '',
    notes: ''
  });

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
        location: item.location || '',
        notes: item.notes || ''
      });
    } else {
      setFormData({
        id: '', brand: 'DELL', partNumber: '', name: '', category: 'laptop',
        cpu: '', ram: '', storage: '', qty: 1, location: '', notes: ''
      });
    }
  }, [item, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtyInt = parseInt(formData.qty, 10) || 0;
    
    const unitObj = {
      ...formData,
      id: formData.id || `custom-${Date.now()}`,
      qty: qtyInt,
      status: qtyInt > 0 ? 'ready' : 'sold',
      updatedAt: new Date().toISOString()
    };
    
    onSave(unitObj);
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
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

          <div className="form-group">
            <label>Catatan Mapping & Keterangan</label>
            <input type="text" name="notes" className="form-control" value={formData.notes} onChange={handleChange} placeholder="Misal: Mapping Kak Pipit RSIJ (5), Kak Puput DIY (1)" />
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
