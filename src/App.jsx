import React, { useState, useEffect } from 'react';
import { Boxes, LayoutTemplate, Upload, Download, Send, PlusCircle, Search, Layers, Laptop, Archive, AlertTriangle, XCircle, RotateCcw, Check, FileSpreadsheet } from 'lucide-react';
import StockAPI from './api';
import Dashboard from './components/Dashboard';
import StockList from './components/StockList';
import StockForm from './components/StockForm';
import ReduceStockModal from './components/ReduceStockModal';
import ExportBrandModal from './components/ExportBrandModal';
import {
  exportSmbHpJpg,
  exportSmbDellJpg,
  exportDistriHpJpg,
  exportDistriDellJpg
} from './services/imageExportService';

function App() {
  const [items, setItems] = useState([]);
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('stock-desc');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockModalItem, setStockModalItem] = useState(null);
  const [stockModalMode, setStockModalMode] = useState('reduce'); // 'reduce' | 'add'

  // Modal pemilihan brand untuk Export SMB & Export Distri
  const [exportModalType, setExportModalType] = useState(null); // 'SMB' | 'Distri' | null

  // Riwayat perubahan untuk fitur Undo
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const filename = await StockAPI.exportExcel();
      showToast(`✓ File Excel "${filename}" berhasil diekspor`);
    } catch (err) {
      console.error('Gagal export excel:', err);
      showToast('⚠️ Gagal mengekspor file Excel. Pastikan server backend aktif.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenExportModal = (type) => {
    setExportModalType(type);
  };

  const handleSelectExportBrand = (brand) => {
    try {
      setIsExporting(true);
      if (exportModalType === 'SMB') {
        if (brand === 'hp') {
          exportSmbHpJpg(items);
          showToast('✓ Gambar JPG Update Stock SMB HP berhasil diunduh');
        } else {
          exportSmbDellJpg(items);
          showToast('✓ Gambar JPG Update Stock SMB Dell berhasil diunduh');
        }
      } else {
        if (brand === 'hp') {
          exportDistriHpJpg();
          showToast('✓ Gambar JPG Laporan Distri HP berhasil diunduh');
        } else {
          exportDistriDellJpg();
          showToast('✓ Gambar JPG Laporan Distri Dell berhasil diunduh');
        }
      }
      setExportModalType(null);
    } catch (err) {
      console.error(`Gagal export gambar ${exportModalType}:`, err);
      showToast(`⚠️ Gagal mengekspor gambar ${exportModalType}. Silakan coba lagi.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectExcelBrand = async (brand) => {
    try {
      setIsExporting(true);
      let filename;
      if (exportModalType === 'SMB') {
        filename = await StockAPI.exportSmb(brand);
        showToast(`✓ File Excel SMB ${brand.toUpperCase()} "${filename}" berhasil diekspor`);
      } else {
        filename = await StockAPI.exportDistri(brand);
        showToast(`✓ File Excel Distri ${brand.toUpperCase()} "${filename}" berhasil diekspor`);
      }
      setExportModalType(null);
    } catch (err) {
      console.error(`Gagal export Excel ${exportModalType}:`, err);
      showToast(`⚠️ Gagal mengekspor file Excel ${exportModalType}. Pastikan server backend aktif.`);
    } finally {
      setIsExporting(false);
    }
  };

  const pushHistory = (desc) => {
    setHistory((prev) => [
      ...prev.slice(-19), // simpan maksimal 20 riwayat
      {
        items: JSON.parse(JSON.stringify(items)),
        desc
      }
    ]);
  };

  useEffect(() => {
    const loadData = async () => {
      await StockAPI.init();
      const data = await StockAPI.getAllStock();
      if (data) {
        setItems(data);
        localStorage.setItem("techstock_modular_inventory", JSON.stringify(data));
      } else {
        // Fallback local fetch
        fetch('/data/stock_inventory.json').then(res => res.json()).then(json => {
          if (json) {
            setItems(json);
            localStorage.setItem("techstock_modular_inventory", JSON.stringify(json));
          }
        }).catch(() => {});
      }
    };
    loadData();
  }, []);

  const getFilteredItems = () => {
    let result = [...items];

    if (activeBrand === "DELL") {
      result = result.filter(u => u.brand === "DELL" && u.qty > 0);
    } else if (activeBrand === "HP") {
      result = result.filter(u => u.brand === "HP" && u.qty > 0);
    } else if (activeBrand === "DELL LAINNYA") {
      result = result.filter(u => u.brand === "DELL LAINNYA" && u.qty > 0);
    } else if (activeBrand === "low") {
      result = result.filter(u => u.qty > 0 && u.qty <= 2);
    } else if (activeBrand === "sold") {
      result = result.filter(u => u.qty === 0);
    } else {
      result = result.filter(u => u.qty > 0);
    }

    if (categoryFilter !== "all") {
      result = result.filter(u => u.category === categoryFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => {
        const text = `${u.name} ${u.partNumber} ${u.brand} ${u.cpu} ${u.ram} ${u.storage} ${u.location} ${u.notes}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (sortFilter === "stock-desc") result.sort((a, b) => b.qty - a.qty);
    else if (sortFilter === "stock-asc") result.sort((a, b) => a.qty - b.qty);
    else if (sortFilter === "name-asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortFilter === "part-asc") result.sort((a, b) => (a.partNumber || "").localeCompare(b.partNumber || ""));

    return result;
  };

  const handleStockChange = async (id, delta) => {
    const itemIdx = items.findIndex(u => u.id === id);
    if (itemIdx < 0) return;
    
    const item = items[itemIdx];
    const oldQty = item.qty;
    const newQty = Math.max(0, oldQty + delta);
    if (newQty === oldQty) return;

    pushHistory(`Tambah stok "${item.name}" (+${delta})`);

    const newItems = [...items];
    newItems[itemIdx] = {
      ...item,
      qty: newQty,
      status: newQty > 0 ? "ready" : "sold",
      updatedAt: new Date().toISOString()
    };
    
    setItems(newItems);
    await StockAPI.updateQuantity(id, delta);
    showToast(`Stok "${item.name}" bertambah menjadi ${newQty}`);
  };

  const handleRequestReduce = (item) => {
    setStockModalMode('reduce');
    setStockModalItem(item);
  };

  const handleRequestAdd = (item) => {
    setStockModalMode('add');
    setStockModalItem(item);
  };

  const handleConfirmStockAdjust = async ({ id, amount, reduceAmount, newQty, location, notes, itemName, mode }) => {
    const itemIdx = items.findIndex(u => u.id === id);
    if (itemIdx < 0) return;

    const adjustAmount = amount || reduceAmount || 1;
    const isAdd = mode === 'add';

    pushHistory(`${isAdd ? 'Penambahan' : 'Pengurangan'} ${adjustAmount} unit "${itemName}"`);

    const item = items[itemIdx];
    const updatedUnit = {
      ...item,
      qty: newQty,
      location,
      notes,
      status: newQty > 0 ? "ready" : "sold",
      updatedAt: new Date().toISOString()
    };

    const newItems = [...items];
    newItems[itemIdx] = updatedUnit;

    setItems(newItems);
    setStockModalItem(null);
    await StockAPI.saveUnit(updatedUnit);
    showToast(`✓ ${isAdd ? 'Penambahan' : 'Pengurangan'} stok "${itemName}" berhasil disimpan (${isAdd ? 'Total' : 'Sisa'}: ${newQty} unit)`);
  };

  const handleSaveUnit = async (unitObj) => {
    const isEdit = !!editingItem;
    pushHistory(isEdit ? `Edit "${unitObj.name}"` : `Tambah "${unitObj.name}"`);
    
    let newItems = [...items];
    if (isEdit) {
      const idx = newItems.findIndex(u => u.id === unitObj.id);
      if (idx >= 0) newItems[idx] = unitObj;
    } else {
      newItems.unshift(unitObj);
    }
    
    setItems(newItems);
    setShowForm(false);
    setEditingItem(null);
    await StockAPI.saveUnit(unitObj);
    showToast(isEdit ? `Data "${unitObj.name}" diperbarui` : `Unit baru "${unitObj.name}" berhasil ditambahkan`);
  };

  const handleDelete = async (id) => {
    const item = items.find(u => u.id === id);
    if (!item) return;
    if (!window.confirm(`Hapus "${item.name}" dari daftar stok berjalan?`)) return;

    pushHistory(`Hapus unit "${item.name}"`);
    setItems(items.filter(u => u.id !== id));
    await StockAPI.deleteUnit(id);
    showToast(`Unit "${item.name}" telah dihapus`);
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    setItems(lastState.items);
    await StockAPI.saveAll(lastState.items);
    showToast(`↺ Berhasil Undo: Membatalkan ${lastState.desc}`);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const openEditForm = (id) => {
    const item = items.find(u => u.id === id);
    if (item) {
      setEditingItem(item);
      setShowForm(true);
    }
  };

  const filteredItems = getFilteredItems();

  const getTabCount = (type) => {
    if (type === 'all') return items.filter(u => u.qty > 0).length;
    if (type === 'DELL') return items.filter(u => u.brand === 'DELL' && u.qty > 0).length;
    if (type === 'HP') return items.filter(u => u.brand === 'HP' && u.qty > 0).length;
    if (type === 'DELL LAINNYA') return items.filter(u => u.brand === 'DELL LAINNYA' && u.qty > 0).length;
    if (type === 'low') return items.filter(u => u.qty > 0 && u.qty <= 2).length;
    if (type === 'sold') return items.filter(u => u.qty === 0).length;
    return 0;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.5L20 7.1V16.9L12 21.5L4 16.9V7.1L12 2.5Z" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L20 7.4" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12V21.5" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L4 7.4" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="2.2" fill="#FFFFFF"/>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">Daftar Stok Berjalan</h1>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-undo"
            onClick={handleUndo}
            disabled={history.length === 0}
            title={history.length > 0 ? `Batalkan: ${history[history.length - 1].desc}` : "Belum ada riwayat perubahan"}
          >
            <RotateCcw size={15} />
            <span>Undo</span>
            {history.length > 0 && <span className="undo-badge">{history.length}</span>}
          </button>
          <button
            type="button"
            className="btn btn-export-excel"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Export data stok terbaru ke format Excel asli (Rekap Stok Barang HP dan Dell)"
          >
            <FileSpreadsheet size={16} />
            <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
          </button>
          <button
            type="button"
            className="btn btn-export-smb"
            onClick={() => handleOpenExportModal('SMB')}
            disabled={isExporting}
            title="Export data stok berjalan ke format resmi SMB (HP / Dell)"
          >
            <FileSpreadsheet size={16} />
            <span>Export SMB</span>
          </button>
          <button
            type="button"
            className="btn btn-export-distri"
            onClick={() => handleOpenExportModal('Distri')}
            disabled={isExporting}
            title="Export data stok berjalan ke format resmi Distributor (HP / Dell)"
          >
            <FileSpreadsheet size={16} />
            <span>Export Distri</span>
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <PlusCircle size={16} />
            <span>+ Tambah Barang</span>
          </button>
        </div>
      </header>

      <Dashboard items={items} />

      <section className="brand-nav-panel">
        <div className="brand-tabs-list">
          <button className={`tab-btn ${activeBrand === 'all' ? 'active' : ''}`} onClick={() => setActiveBrand('all')}>
            <Layers size={14} /><span>Semua Stok</span><span className="tab-badge">{getTabCount('all')}</span>
          </button>
          <button className={`tab-btn ${activeBrand === 'DELL' ? 'active' : ''}`} onClick={() => setActiveBrand('DELL')}>
            <Laptop size={14} /><span>DELL</span><span className="tab-badge">{getTabCount('DELL')}</span>
          </button>
          <button className={`tab-btn ${activeBrand === 'HP' ? 'active' : ''}`} onClick={() => setActiveBrand('HP')}>
            <Laptop size={14} /><span>HP</span><span className="tab-badge">{getTabCount('HP')}</span>
          </button>
          <button className={`tab-btn ${activeBrand === 'DELL LAINNYA' ? 'active' : ''}`} onClick={() => setActiveBrand('DELL LAINNYA')}>
            <Archive size={14} /><span>Dell Lainnya</span><span className="tab-badge">{getTabCount('DELL LAINNYA')}</span>
          </button>
          <button className={`tab-btn ${activeBrand === 'low' ? 'active' : ''}`} onClick={() => setActiveBrand('low')}>
            <AlertTriangle size={14} /><span>Stok Kritis</span><span className="tab-badge">{getTabCount('low')}</span>
          </button>
          <button className={`tab-btn ${activeBrand === 'sold' ? 'active' : ''}`} onClick={() => setActiveBrand('sold')}>
            <XCircle size={14} /><span>Habis (0)</span><span className="tab-badge">{getTabCount('sold')}</span>
          </button>
        </div>

        <div className="filter-search-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={15} />
            <input type="text" placeholder="Cari Part Number, tipe laptop/PC (3440, 240 G8, 7010)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-selects-group">
            <select className="custom-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">Semua Kategori</option>
              <option value="laptop">Laptop / Notebook</option>
              <option value="pc-desktop">PC Desktop / Tower</option>
              <option value="pc-mini">Mini PC / Micro</option>
              <option value="aio">All-in-One (AIO)</option>
            </select>
            <select className="custom-select" value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
              <option value="stock-desc">Stok Terbanyak</option>
              <option value="stock-asc">Stok Tersedikit</option>
              <option value="name-asc">Nama A - Z</option>
              <option value="part-asc">Part Number A - Z</option>
            </select>
          </div>
        </div>
      </section>

      <StockList 
        items={filteredItems} 
        onStockChange={handleStockChange} 
        onRequestReduce={handleRequestReduce}
        onRequestAdd={handleRequestAdd}
        onDelete={handleDelete}
        onEdit={openEditForm}
      />

      <StockForm 
        show={showForm} 
        item={editingItem} 
        onClose={() => setShowForm(false)} 
        onSave={handleSaveUnit} 
      />

      <ReduceStockModal
        show={!!stockModalItem}
        item={stockModalItem}
        mode={stockModalMode}
        onClose={() => setStockModalItem(null)}
        onConfirm={handleConfirmStockAdjust}
      />

      <ExportBrandModal
        show={!!exportModalType}
        exportType={exportModalType}
        onClose={() => setExportModalType(null)}
        onSelectBrand={handleSelectExportBrand}
        onSelectExcelBrand={handleSelectExcelBrand}
        isExporting={isExporting}
      />

      {toastMessage && (
        <div className="toast-shelf">
          <div className="toast-item">
            <Check size={16} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
