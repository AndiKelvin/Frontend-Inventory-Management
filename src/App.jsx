import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusCircle, Search, Layers, Laptop, Archive, AlertTriangle, XCircle, RotateCcw, Check, FileSpreadsheet, History, Upload, BookmarkCheck, Lock, Building2, RefreshCw, ChevronDown, Sun, Moon } from 'lucide-react';
import StockAPI from './api';
import {
  Dashboard,
  StockList,
  StockForm,
  ReduceStockModal,
  ExportBrandModal,
  MovementLogsModal,
  ImportExcelModal,
  MasterDataModal,
  ConfirmDialog,
  PinLockScreen
} from './components';
import { getBookedQty } from './utils/stockUtils';
import {
  exportSmbHpJpg,
  exportSmbDellJpg,
  exportDistriHpJpg,
  exportDistriDellJpg
} from './services/imageExportService';

function App() {
  const [items, setItems] = useState(() => {
    try {
      const local = localStorage.getItem('techstock_modular_inventory');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('stock-desc');

  // Tema Tampilan (Dark Mode / Light Mode)
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('techstock_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('techstock_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(nextTheme === 'dark' ? '🌙 Mode Gelap (Dark Mode) aktif' : '☀️ Mode Terang (Light Mode) aktif');
  };
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockModalItem, setStockModalItem] = useState(null);
  const [stockModalMode, setStockModalMode] = useState('reduce'); // 'reduce' | 'add'

  // Modal Riwayat Mutasi, Import Excel, & Master Data
  const [showMovementLogs, setShowMovementLogs] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);

  // Dialog Konfirmasi Hapus Unit Kustom
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);

  // Status Sinkronisasi Latar Belakang (Auto Polling)
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Modal pemilihan brand untuk Export SMB & Export Distri
  const [exportModalType, setExportModalType] = useState(null); // 'SMB' | 'Distri' | null

  // Riwayat perubahan untuk fitur Undo
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Dropdown Export Menu
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setShowExportDropdown(false);
      }
    };
    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Shortcut Escape global untuk menutup modal/popup yang aktif
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showExportDropdown) {
          setShowExportDropdown(false);
        } else if (deleteTargetItem) {
          setDeleteTargetItem(null);
        } else if (showMovementLogs || stockModalItem) {
          return;
        } else if (showForm) {
          setShowForm(false);
        } else if (showMasterModal) {
          setShowMasterModal(false);
        } else if (exportModalType) {
          setExportModalType(null);
        } else if (showImportModal) {
          setShowImportModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [deleteTargetItem, showMovementLogs, stockModalItem, showForm, showMasterModal, exportModalType, showImportModal, showExportDropdown]);

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

  // Autentikasi PIN Gate
  const [isAuthenticated, setIsAuthenticated] = useState(() => StockAPI.hasLocalToken());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Inisialisasi & Verifikasi Sesi Token saat web pertama kali dibuka
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      await StockAPI.init();
      if (StockAPI.hasLocalToken()) {
        const isValid = await StockAPI.checkAuth();
        if (isMounted) setIsAuthenticated(isValid);
      } else {
        if (isMounted) setIsAuthenticated(false);
      }
      if (isMounted) setIsCheckingAuth(false);
    };
    verifyAuth();

    // Event jika sewaktu-waktu backend mengirim 401 Unauthorized
    const handleUnauthorizedEvent = () => {
      if (isMounted) setIsAuthenticated(false);
    };
    window.addEventListener('techstock-unauthorized', handleUnauthorizedEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('techstock-unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  const handleLogout = useCallback(async (msg = '🔒 Sesi telah dikunci') => {
    await StockAPI.logout();
    setIsAuthenticated(false);
    showToast(msg);
  }, []);

  // Auto-Lock Sesi Otomatis (Inactivity Timer 10 Menit = 600.000 ms)
  useEffect(() => {
    if (!isAuthenticated) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
    let lastActivity = Date.now();
    let timeoutId;

    const lockDueToInactivity = () => {
      handleLogout('🔒 Sesi terkunci otomatis karena tidak ada aktivitas selama 10 menit');
    };

    const scheduleTimer = () => {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
      timeoutId = setTimeout(() => {
        lockDueToInactivity();
      }, remaining);
    };

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        lastActivity = now;
        scheduleTimer();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivity;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          lockDueToInactivity();
        } else {
          scheduleTimer();
        }
      }
    };

    scheduleTimer();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, handleLogout]);

  // Fetch data hanya jika pengguna terautentikasi
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
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
  }, [isAuthenticated]);

  // Background Auto-Refresh Polling (setiap 25 detik saat tab aktif)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const freshData = await StockAPI.getAllStock();
        if (freshData && Array.isArray(freshData)) {
          setItems((prevItems) => {
            const isDifferent =
              prevItems.length !== freshData.length ||
              freshData.some((f, idx) => {
                const p = prevItems[idx];
                return !p || p.id !== f.id || p.qty !== f.qty || p.updatedAt !== f.updatedAt;
              });
            if (isDifferent) {
              localStorage.setItem('techstock_modular_inventory', JSON.stringify(freshData));
              return freshData;
            }
            return prevItems;
          });
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.warn('Auto-sync background check gagal:', err);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleManualSync = async () => {
    setIsLiveSyncing(true);
    try {
      const freshData = await StockAPI.getAllStock();
      if (freshData && Array.isArray(freshData)) {
        setItems(freshData);
        localStorage.setItem('techstock_modular_inventory', JSON.stringify(freshData));
        setLastSyncTime(new Date());
        showToast('✓ Data stok berhasil disinkronisasi dengan server');
      }
    } catch {
      showToast('⚠️ Gagal sinkronisasi data dengan server');
    } finally {
      setIsLiveSyncing(false);
    }
  };

  const getFilteredItems = () => {
    let result = [...items];

    if (activeBrand === "DELL") {
      result = result.filter(u => u.brand === "DELL" && u.qty > 0);
    } else if (activeBrand === "HP") {
      result = result.filter(u => u.brand === "HP" && u.qty > 0);
    } else if (activeBrand === "DELL LAINNYA") {
      result = result.filter(u => u.brand === "DELL LAINNYA" && u.qty > 0);
    } else if (activeBrand === "booking") {
      result = result.filter(u => getBookedQty(u) > 0 && u.qty > 0);
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
    await StockAPI.updateQuantity(id, delta, {
      actor: 'Admin Gudang',
      reference: 'STEPPER-TABLE',
      notes: delta > 0 ? `Penambahan cepat via tombol tabel (+${delta} unit)` : `Pengurangan cepat via tombol tabel (${delta} unit)`,
      location: item.location || 'Gudang Utama'
    });
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

  const handleConfirmStockAdjust = async ({
    id,
    amount,
    reduceAmount,
    newQty,
    location,
    notes,
    itemName,
    mode,
    actor,
    reference,
    movementNotes,
    locationTarget,
    isBookingFulfillment
  }) => {
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

    // Kirim data unit dan rekaman mutasi stok ke server
    const movementType = isAdd ? 'IN' : (isBookingFulfillment ? 'BOOKING' : 'OUT');
    await StockAPI.saveUnit({
      ...updatedUnit,
      movement: {
        type: movementType,
        amount: adjustAmount,
        previousQty: item.qty,
        location: locationTarget || location || item.location,
        actor: actor || (isAdd ? 'Admin Gudang' : 'Sales / Penerima'),
        reference: reference || '-',
        notes: movementNotes || (isAdd ? `Penambahan ${adjustAmount} unit` : `Pengurangan ${adjustAmount} unit`)
      }
    });

    showToast(`✓ ${isAdd ? 'Penambahan' : 'Pengurangan'} stok "${itemName}" berhasil disimpan (${isAdd ? 'Total' : 'Sisa'}: ${newQty} unit)`);
  };

  const handleImportSuccess = async (newItems, count, mode) => {
    setItems(newItems);
    await StockAPI.saveAll(newItems);
    await StockAPI.recordMovement({
      itemId: 'import-excel',
      partNumber: 'EXCEL-IMPORT',
      itemName: `Import Rekap Excel (${count} Unit)`,
      brand: 'ALL',
      type: 'IN',
      amount: count,
      location: 'Gudang Utama',
      actor: 'Admin',
      reference: mode === 'replace' ? 'REPLACE-ALL' : 'MERGE',
      notes: `Import data ${count} unit dari file Excel via Web`
    });
    showToast(`✓ Berhasil mengimpor ${count} unit barang dari Excel (${mode === 'replace' ? 'Gantikan Semua' : 'Update/Merge'})`);
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

  const handleDelete = (id) => {
    const item = items.find(u => u.id === id);
    if (!item) return;
    setDeleteTargetItem(item);
  };

  const confirmDeleteItem = async () => {
    if (!deleteTargetItem) return;
    const item = deleteTargetItem;
    setDeleteTargetItem(null);

    pushHistory(`Hapus unit "${item.name}"`);
    setItems(items.filter(u => u.id !== item.id));
    await StockAPI.deleteUnit(item.id);
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
    if (type === 'booking') return items.filter(u => getBookedQty(u) > 0 && u.qty > 0).length;
    if (type === 'low') return items.filter(u => u.qty > 0 && u.qty <= 2).length;
    if (type === 'sold') return items.filter(u => u.qty === 0).length;
    return 0;
  };

  return (
    <>
      <div
        className="app-container"
        style={!isAuthenticated ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', transition: 'filter 0.3s ease' } : { transition: 'filter 0.3s ease' }}
        aria-hidden={!isAuthenticated}
      >
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
            <p className="brand-subtitle">Concordia Group</p>
          </div>
        </div>
        <div className="header-actions">
          {/* Kelompok 1: Data & Histori */}
          <div className="header-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowMasterModal(true)}
              title="Kelola Master Data Customer (Klien) dan Tim Sales"
            >
              <Building2 size={15} color="#0284C7" />
              <span>Master Data</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowMovementLogs(true)}
              title="Lihat riwayat History (keluar-masuk barang, serah terima sales, dan audit no PO)"
            >
              <History size={15} color="#2563EB" />
              <span>History</span>
            </button>
          </div>

          <div className="header-divider" />

          {/* Kelompok 2: Berkas I/O (Import & Export) */}
          <div className="header-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowImportModal(true)}
              title="Import data rekap stok dari file Excel / CSV"
            >
              <Upload size={15} color="#059669" />
              <span>Import</span>
            </button>

            {/* Dropdown 3-in-1 Export */}
            <div className="export-dropdown-wrapper" ref={exportDropdownRef}>
              <button
                type="button"
                className="btn btn-secondary btn-export-dropdown"
                onClick={() => setShowExportDropdown(prev => !prev)}
                disabled={isExporting}
                title="Pilihan Export Data Stok (Excel Asli, SMB, Distributor)"
              >
                <FileSpreadsheet size={15} color="#059669" />
                <span>{isExporting ? 'Mengekspor...' : 'Export'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: showExportDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'currentColor'
                  }}
                />
              </button>

              {showExportDropdown && (
                <div className="export-dropdown-menu">
                  <div className="export-dropdown-header">Format Export</div>
                  <button
                    type="button"
                    className="export-dropdown-item"
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleExportExcel();
                    }}
                  >
                    <div className="export-item-icon excel-icon">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div className="export-item-text">
                      <div className="export-item-title">Rekap Stok Barang</div>
                      <div className="export-item-desc">File Excel asli (HP &amp; Dell)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="export-dropdown-item"
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleOpenExportModal('SMB');
                    }}
                  >
                    <div className="export-item-icon smb-icon">
                      <Building2 size={16} />
                    </div>
                    <div className="export-item-text">
                      <div className="export-item-title">Format Resmi SMB</div>
                      <div className="export-item-desc">Excel / Gambar JPG (HP / Dell)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="export-dropdown-item"
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleOpenExportModal('Distri');
                    }}
                  >
                    <div className="export-item-icon distri-icon">
                      <Upload size={16} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                    <div className="export-item-text">
                      <div className="export-item-title">Format Resmi Distributor</div>
                      <div className="export-item-desc">Excel / Gambar JPG (HP / Dell)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="header-divider" />

          {/* Kelompok 3: Aksi Utama */}
          <button className="btn btn-primary" onClick={openAddForm} title="Tambah data stok barang baru">
            <PlusCircle size={15} />
            <span>+ Tambah Barang</span>
          </button>

          <div className="header-divider" />

          {/* Kelompok 4: Utilitas Sistem (Icon-Only & Status Pill) */}
          <div className="header-group header-utilities-group">
            <button
              type="button"
              className="btn-header-compact live-sync-pill"
              onClick={handleManualSync}
              disabled={isLiveSyncing}
              title={`Live Sync Aktif (Klik untuk sinkronisasi manual)\nTerakhir sinkron: ${lastSyncTime.toLocaleTimeString()}`}
            >
              <span className="live-dot" />
              <RefreshCw size={12} className={isLiveSyncing ? 'spin' : ''} />
              <span>{isLiveSyncing ? 'Sinkron...' : 'Live'}</span>
            </button>

            <button
              type="button"
              className="btn-header-icon"
              onClick={handleUndo}
              disabled={history.length === 0}
              title={history.length > 0 ? `Batalkan: ${history[history.length - 1].desc}` : "Belum ada riwayat perubahan"}
              aria-label="Undo riwayat"
            >
              <RotateCcw size={14} />
              {history.length > 0 && <span className="undo-badge-floating">{history.length}</span>}
            </button>

            <button
              type="button"
              className="btn-header-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#6366F1" />}
            </button>

            <button
              type="button"
              className="btn-header-icon btn-lock-icon"
              onClick={() => handleLogout()}
              title="Kunci sesi web (Otomatis terkunci jika 10 menit tidak aktif)"
              aria-label="Kunci sesi"
            >
              <Lock size={14} color="#DC2626" />
            </button>
          </div>
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
          <button className={`tab-btn tab-btn-booking ${activeBrand === 'booking' ? 'active' : ''}`} onClick={() => setActiveBrand('booking')}>
            <BookmarkCheck size={14} className="tab-booking-icon" />
            <span>Di-Booking (Mapping)</span>
            <span className="tab-badge tab-badge-booking">{getTabCount('booking')}</span>
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
        onToast={showToast}
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

      <MovementLogsModal
        show={showMovementLogs}
        onClose={() => setShowMovementLogs(false)}
        items={items}
      />

      <ImportExcelModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        currentItems={items}
        onImportSuccess={handleImportSuccess}
      />

      <MasterDataModal
        show={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        items={items}
        onDataChanged={handleManualSync}
      />

      <ConfirmDialog
        show={!!deleteTargetItem}
        title="Hapus Barang?"
        message={`Apakah Anda yakin ingin menghapus "${deleteTargetItem?.name}" (${deleteTargetItem?.partNumber || '-'}) dari daftar stok berjalan? Tindakan ini dapat dibatalkan melalui tombol Undo.`}
        confirmText="Ya, Hapus Barang"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDeleteItem}
        onClose={() => setDeleteTargetItem(null)}
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

      {!isAuthenticated && (
        <PinLockScreen onAuthenticated={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}

export default App;
