import React, { useState, useEffect } from 'react';
import { Boxes, LayoutTemplate, Upload, Download, Send, PlusCircle, Search, Layers, Laptop, Archive, AlertTriangle, XCircle } from 'lucide-react';
import StockAPI from './api';
import Dashboard from './components/Dashboard';
import StockList from './components/StockList';
import StockForm from './components/StockForm';

function App() {
  const [items, setItems] = useState([]);
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('stock-desc');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await StockAPI.init();
      const data = await StockAPI.getAllStock();
      if (data) {
        setItems(data);
      } else {
        // Fallback local fetch
        fetch('/data/stock_inventory.json').then(res => res.json()).then(json => {
          if (json) setItems(json);
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

    const newItems = [...items];
    newItems[itemIdx] = {
      ...item,
      qty: newQty,
      status: newQty > 0 ? "ready" : "sold",
      updatedAt: new Date().toISOString()
    };
    
    setItems(newItems);
    await StockAPI.updateQuantity(id, delta);
  };

  const handleSaveUnit = async (unitObj) => {
    const isEdit = !!editingItem;
    
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
  };

  const handleDelete = async (id) => {
    const item = items.find(u => u.id === id);
    if (!item) return;
    if (!window.confirm(`Hapus "${item.name}" dari daftar stok berjalan?`)) return;

    setItems(items.filter(u => u.id !== id));
    await StockAPI.deleteUnit(id);
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
          <div className="brand-icon"><Boxes size={24} /></div>
          <div>
            <h1 className="brand-title">Daftar Stok Berjalan</h1>
            <p className="brand-subtitle">Kelola & pantau ketersediaan barang ready jual (React Version)</p>
          </div>
        </div>
        <div className="header-actions">
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
        onDelete={handleDelete}
        onEdit={openEditForm}
      />

      <StockForm 
        show={showForm} 
        item={editingItem} 
        onClose={() => setShowForm(false)} 
        onSave={handleSaveUnit} 
      />
    </div>
  );
}

export default App;
