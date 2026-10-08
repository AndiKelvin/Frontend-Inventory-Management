import React, { useState, useEffect, useRef } from 'react';
import { X, Save, MapPin, Monitor, Wrench, AlertTriangle, ArrowRight, Check, UserCheck, PlusCircle, Info, Search, ChevronDown, Building2 } from 'lucide-react';
import { getBookedQty, parseNotesAndMapping, formatNotesAndMapping } from '../../utils/stockUtils';
import StockAPI from '../../api';

/**
 * Helper untuk mengurai akumulasi stok per lokasi/kategori dari data item
 */
const parseLocationBreakdown = (item) => {
  const isSpecial = (item?.partNumber || '').trim().toUpperCase() === '365K5PA';
  const locStr = item?.location || '';
  const totalQty = parseInt(item?.qty, 10) || 0;

  const extract = (pattern) => {
    const m = locStr.match(pattern);
    return m ? parseInt(m[m.length - 1], 10) : 0;
  };

  const pallazo = extract(/pallazo[^\d(]*\((\d+)\)/i);
  const sby = extract(/(?:sby|surabaya)[^\d(]*\((\d+)\)/i);
  const smg = extract(/(?:smg|semarang)[^\d(]*\((\d+)\)/i);
  const ambas = extract(/(?:ambas|ambassador)[^\d(]*\((\d+)\)/i);
  const jkt = extract(/(?:it talk\s+jkt|jakarta)[^\d(]*\((\d+)\)/i);
  const klaimDoa = extract(/klaim[^\d(]*\((\d+)\)/i);
  const service = extract(/service[s]?[^\d(]*\((\d+)\)/i);
  const demo = extract(/demo[^\d(]*\((\d+)\)/i);

  if (isSpecial) {
    // Khusus 365K5PA: Total 62 = Pallazo (43) + Klaim DOA (2) + Service (17)
    return {
      pallazo: pallazo || Math.max(0, totalQty - (klaimDoa || 2) - (service || 17)),
      klaimDoa: klaimDoa || 2,
      service: service || 17,
      demo: 0,
      sby: 0,
      smg: 0,
      ambas: 0,
      jkt: 0,
      isSpecial: true
    };
  }

  const hasAnyParentheses = (pallazo + sby + smg + ambas + jkt + klaimDoa + service + demo) > 0;

  return {
    pallazo: hasAnyParentheses ? pallazo : (locStr.toLowerCase().includes('surabaya') || locStr.toLowerCase().includes('semarang') || locStr.toLowerCase().includes('ambas') ? 0 : totalQty),
    sby: hasAnyParentheses ? sby : (locStr.toLowerCase().includes('surabaya') ? totalQty : 0),
    smg: hasAnyParentheses ? smg : (locStr.toLowerCase().includes('semarang') ? totalQty : 0),
    ambas: hasAnyParentheses ? ambas : (locStr.toLowerCase().includes('ambas') ? totalQty : 0),
    jkt,
    klaimDoa,
    service,
    demo,
    isSpecial: false
  };
};

const ReduceStockModal = ({ show, item, mode = 'reduce', onClose, onConfirm }) => {
  const isAdd = mode === 'add';

  // Cek apakah part number adalah 365K5PA
  const isSpecialPart = (item?.partNumber || '').trim().toUpperCase() === '365K5PA';

  // Pilihan kategori aktif: 'lokasi' | 'demo' | 'service' | 'klaim_doa'
  const [activeCategory, setActiveCategory] = useState('lokasi');

  // Pilihan lokasi gudang (untuk button Lokasi)
  const [selectedLocation, setSelectedLocation] = useState('Pallazo');

  // Nilai angka untuk masing-masing filter button
  const [lokasiQty, setLokasiQty] = useState(1);
  const [demoQty, setDemoQty] = useState(1);
  const [serviceQty, setServiceQty] = useState(1);
  const [doaQty, setDoaQty] = useState(1);

  // Input audit mutasi
  const [actorInput, setActorInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isBookingFulfillment, setIsBookingFulfillment] = useState(false);
  const [selectedClosingSalesId, setSelectedClosingSalesId] = useState('');

  // State pencarian database customer & list sales
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);

  const salesRef = useRef(null);
  const customerRef = useRef(null);

  // Ambil data customer dan sales dari database saat modal dibuka
  useEffect(() => {
    if (show) {
      StockAPI.getCustomers().then(data => {
        if (Array.isArray(data)) setCustomers(data);
      });
      StockAPI.getSales().then(data => {
        if (Array.isArray(data)) setSalesList(data);
      });
    }
  }, [show]);

  // Listener klik di luar dropdown untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (salesRef.current && !salesRef.current.contains(e.target)) {
        setShowSalesDropdown(false);
      }
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Shortcut tombol Esc untuk menutup modal / dropdown
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCustomerDropdown || showSalesDropdown) {
          setShowCustomerDropdown(false);
          setShowSalesDropdown(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, showCustomerDropdown, showSalesDropdown, onClose]);

  useEffect(() => {
    if (item) {
      setActiveCategory('lokasi');
      setLokasiQty(1);
      setDemoQty(1);
      setServiceQty(1);
      setDoaQty(1);
      setActorInput('');
      setRefInput('');
      setNotesInput('');
      setIsBookingFulfillment(false);
      setSelectedCustomerDetail(null);
      setShowCustomerDropdown(false);
      setShowSalesDropdown(false);

      const { mappings: parsedMaps } = parseNotesAndMapping(item.notes || '');
      if (parsedMaps.length > 0) {
        setSelectedClosingSalesId(parsedMaps[0].id);
      } else {
        setSelectedClosingSalesId('');
      }

      const breakdownData = parseLocationBreakdown(item);

      // Cek lokasi awal dari data item: pilih lokasi pertama yang memiliki stok > 0
      if (breakdownData.pallazo > 0) {
        setSelectedLocation('Pallazo');
      } else if (breakdownData.smg > 0) {
        setSelectedLocation('IT Talk Semarang');
      } else if (breakdownData.sby > 0) {
        setSelectedLocation('IT Talk Surabaya');
      } else if (breakdownData.ambas > 0) {
        setSelectedLocation('IT Talk Ambassador');
      } else if (breakdownData.jkt > 0) {
        setSelectedLocation('IT Talk JKT');
      } else {
        const locStr = (item.location || '').toLowerCase();
        if (locStr.includes('semarang') || locStr.includes('smg')) {
          setSelectedLocation('IT Talk Semarang');
        } else if (locStr.includes('surabaya') || locStr.includes('sby')) {
          setSelectedLocation('IT Talk Surabaya');
        } else if (locStr.includes('ambassador') || locStr.includes('ambas')) {
          setSelectedLocation('IT Talk Ambassador');
        } else {
          setSelectedLocation('Pallazo');
        }
      }
    }
  }, [item, show, mode]);

  if (!show || !item) return null;

  const currentQty = parseInt(item.qty, 10) || 0;
  const breakdown = parseLocationBreakdown(item);
  const { mappings: itemMappings, keterangan: itemKeterangan } = parseNotesAndMapping(item.notes || '');
  const existingBooked = itemMappings.reduce((sum, m) => sum + (parseInt(m.qty, 10) || 0), 0);
  const readyAvailable = Math.max(0, currentQty - existingBooked);
  const activeClosingSales = itemMappings.find(m => m.id === selectedClosingSalesId) || itemMappings[0];

  // Daftar gudang yang tersedia untuk pilihan Lokasi
  const availableWarehouses = [
    { key: 'Pallazo', label: 'Pallazo', count: breakdown.pallazo },
    { key: 'IT Talk Surabaya', label: 'IT Talk Surabaya', count: breakdown.sby },
    { key: 'IT Talk Semarang', label: 'IT Talk Semarang', count: breakdown.smg },
    { key: 'IT Talk Ambassador', label: 'IT Talk Ambassador', count: breakdown.ambas }
  ];
  if (breakdown.jkt > 0 || (item.location && item.location.toLowerCase().includes('jkt'))) {
    availableWarehouses.push({ key: 'IT Talk JKT', label: 'IT Talk JKT', count: breakdown.jkt });
  }

  // Hitung stok maksimal yang tersedia untuk kategori dan lokasi yang aktif
  const getMaxAvailableForCategory = () => {
    if (isAdd) {
      return 9999; // Penambahan tidak dibatasi oleh stok saat ini
    }
    if (isBookingFulfillment && activeClosingSales) {
      return Math.max(1, activeClosingSales.qty);
    }
    if (activeCategory === 'demo') {
      return breakdown.demo > 0 ? breakdown.demo : (breakdown.pallazo > 0 ? breakdown.pallazo : currentQty);
    }
    if (activeCategory === 'service') {
      return breakdown.service > 0 ? breakdown.service : currentQty;
    }
    if (activeCategory === 'klaim_doa' && isSpecialPart) {
      return breakdown.klaimDoa;
    }
    // activeCategory === 'lokasi'
    if (selectedLocation === 'IT Talk Surabaya') return breakdown.sby;
    if (selectedLocation === 'IT Talk Semarang') return breakdown.smg;
    if (selectedLocation === 'IT Talk Ambassador') return breakdown.ambas;
    if (selectedLocation === 'IT Talk JKT') return breakdown.jkt;
    return breakdown.pallazo > 0 ? breakdown.pallazo : currentQty;
  };

  const availableInSelectedCategory = getMaxAvailableForCategory();
  const maxAllowed = isAdd ? 9999 : Math.max(1, availableInSelectedCategory || 1);
  const isSelectedLocationEmpty = !isAdd && activeCategory === 'lokasi' && availableInSelectedCategory === 0;

  // Hitung jumlah unit yang disesuaikan (tambah / kurang) sesuai button yang aktif
  let currentAdjustAmount = 1;
  if (activeCategory === 'lokasi') currentAdjustAmount = Math.max(1, Math.min(maxAllowed, parseInt(lokasiQty, 10) || 1));
  else if (activeCategory === 'demo') currentAdjustAmount = Math.max(1, Math.min(maxAllowed, parseInt(demoQty, 10) || 1));
  else if (activeCategory === 'service') currentAdjustAmount = Math.max(1, Math.min(maxAllowed, parseInt(serviceQty, 10) || 1));
  else if (activeCategory === 'klaim_doa' && isSpecialPart) currentAdjustAmount = Math.max(1, Math.min(maxAllowed, parseInt(doaQty, 10) || 1));

  const resultingQty = isAdd ? currentQty + currentAdjustAmount : Math.max(0, currentQty - currentAdjustAmount);

  // Filter daftar sales sesuai input
  const filteredSales = salesList.filter(s => {
    if (!actorInput) return true;
    return s.toLowerCase().includes(actorInput.toLowerCase().trim());
  });

  // Filter database customer sesuai pencarian (maksimal 30 opsi teratas agar ringan & cepat)
  const filteredCustomers = customers.filter(c => {
    if (!notesInput) return true;
    const q = notesInput.toLowerCase().trim();
    return (
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.contactName && c.contactName.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }).slice(0, 30);

  // Hitung teks Lokasi dan Mapping secara dinamis dan tersinkronisasi untuk SEMUA BARANG
  const getSyncedOutputs = () => {
    // Tentukan catatan mapping yang disinkronkan
    let mappingText = '';

    if (isAdd) {
      // Penambahan stok tidak mengubah alokasi mapping
      mappingText = formatNotesAndMapping(itemMappings, itemKeterangan);
    } else {
      // Pengurangan stok
      if (isBookingFulfillment && activeClosingSales) {
        // Closing mappingan: kurangi kuantitas mapping sales yang dipilih
        const updatedMappings = itemMappings.map(m => {
          if (m.id === activeClosingSales.id) {
            return { ...m, qty: Math.max(0, m.qty - currentAdjustAmount) };
          }
          return m;
        }).filter(m => m.qty > 0);
        mappingText = formatNotesAndMapping(updatedMappings, itemKeterangan);
      } else {
        // Penjualan barang ready: mapping TETAP UTUH dan TIDAK dilabeli mapping baru
        mappingText = formatNotesAndMapping(itemMappings, itemKeterangan);
      }
    }

    if (!isAdd && resultingQty === 0) {
      return {
        locationText: `Habis (0) - Terakhir di ${selectedLocation}`,
        mappingText
      };
    }

    // Kasus khusus 365K5PA
    if (isSpecialPart) {
      let remPallazo = breakdown.pallazo;
      let remKlaim = breakdown.klaimDoa;
      let remService = breakdown.service;

      if (isAdd) {
        if (activeCategory === 'lokasi') {
          if (selectedLocation === 'Pallazo') remPallazo += currentAdjustAmount;
        } else if (activeCategory === 'service') {
          remService += currentAdjustAmount;
        } else if (activeCategory === 'klaim_doa') {
          remKlaim += currentAdjustAmount;
        }
      } else {
        if (activeCategory === 'lokasi') {
          remPallazo = Math.max(0, remPallazo - currentAdjustAmount);
        } else if (activeCategory === 'demo') {
          remPallazo = Math.max(0, remPallazo - currentAdjustAmount);
        } else if (activeCategory === 'service') {
          remService = Math.max(0, remService - currentAdjustAmount);
        } else if (activeCategory === 'klaim_doa') {
          remKlaim = Math.max(0, remKlaim - currentAdjustAmount);
        }
      }

      const locParts = [];
      if (remPallazo > 0) locParts.push(`PALLAZO (${remPallazo})`);
      if (remKlaim > 0) locParts.push(`KLAIM HP (${remKlaim})`);
      if (remService > 0) locParts.push(`SERVICE (${remService})`);

      return {
        locationText: locParts.length > 0 ? locParts.join(', ') : `${selectedLocation} (${resultingQty})`,
        mappingText
      };
    }

    // Kasus Umum untuk SEMUA BARANG (Dell, HP lainnya, dll.)
    let matcher = null;
    let targetLabel = selectedLocation;

    if (activeCategory === 'demo') {
      matcher = /(demo[^\d(]*)\((\d+)\)/i;
      targetLabel = 'Demo';
    } else if (activeCategory === 'service') {
      matcher = /(service[s]?[^\d(]*)\((\d+)\)/i;
      targetLabel = 'Service';
    } else {
      // activeCategory === 'lokasi'
      const t = selectedLocation.toLowerCase();
      if (t.includes('surabaya') || t === 'sby') {
        matcher = /(?:it talk\s+)?(sby|surabaya)[^\d(]*\((\d+)\)/i;
        targetLabel = 'IT Talk Surabaya';
      } else if (t.includes('semarang') || t === 'smg') {
        matcher = /(?:it talk\s+)?(smg|semarang)[^\d(]*\((\d+)\)/i;
        targetLabel = 'IT Talk Semarang';
      } else if (t.includes('ambas') || t.includes('ambassador')) {
        matcher = /(?:it talk\s+)?(ambas|ambassador)[^\d(]*\((\d+)\)/i;
        targetLabel = 'IT Talk Ambassador';
      } else if (t.includes('jkt') || t.includes('jakarta')) {
        matcher = /(?:it talk\s+)?(jkt|jakarta)[^\d(]*\((\d+)\)/i;
        targetLabel = 'IT Talk JKT';
      } else {
        matcher = /(pallazo|plz)[^\d(]*\((\d+)\)/i;
        targetLabel = 'Pallazo';
      }
    }

    const locStr = item.location || '';
    const cleanLoc = locStr.startsWith('Habis (0)') ? '' : locStr;
    const match = cleanLoc.match(matcher);

    if (match) {
      const currentCount = parseInt(match[match.length - 1], 10);
      const newCount = isAdd ? currentCount + currentAdjustAmount : Math.max(0, currentCount - currentAdjustAmount);

      // Ganti persis segmen lokasi yang disesuaikan
      const updatedLocation = cleanLoc.replace(matcher, (full) => {
        return full.replace(`(${currentCount})`, `(${newCount})`);
      });

      return { locationText: updatedLocation, mappingText };
    }

    // Jika lokasi belum ada di string saat penambahan
    if (isAdd) {
      const updatedLocation = cleanLoc ? `${cleanLoc}, ${targetLabel} (${currentAdjustAmount})` : `${targetLabel} (${currentAdjustAmount})`;
      return { locationText: updatedLocation, mappingText };
    }

    // Fallback jika tidak ada segmen kurung dalam lokasi asli saat pengurangan
    return {
      locationText: `${targetLabel} (${resultingQty})`,
      mappingText
    };
  };

  const { locationText: syncedLocationPreview, mappingText: syncedMappingPreview } = getSyncedOutputs();

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!isAdd && currentQty <= 0) || isSelectedLocationEmpty) return;

    onConfirm({
      id: item.id,
      amount: currentAdjustAmount,
      reduceAmount: currentAdjustAmount, // kompatibilitas ke belakang
      newQty: resultingQty,
      location: syncedLocationPreview,
      notes: syncedMappingPreview,
      itemName: item.name,
      brand: item.brand,
      partNumber: item.partNumber,
      mode,
      actor: actorInput.trim() || (isAdd ? 'Admin Gudang' : (isBookingFulfillment ? (activeClosingSales?.sales || 'Sales') : 'Sales / Penerima')),
      reference: refInput.trim() || '-',
      movementNotes: notesInput.trim() || (isAdd ? `Penambahan ke ${selectedLocation}` : (isBookingFulfillment ? `Closing mapping ${activeClosingSales?.sales || 'Sales'} (${currentAdjustAmount} unit)` : `Pengeluaran ready stock dari ${selectedLocation}`)),
      locationTarget: selectedLocation,
      category: activeCategory,
      isBookingFulfillment
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box reduce-stock-modal" style={{ maxWidth: '560px' }}>
        {/* Header Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: isAdd ? '#DCFCE7' : '#FEE2E2',
              color: isAdd ? '#15803D' : '#DC2626',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isAdd ? <PlusCircle size={20} /> : <MapPin size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem' }}>
                {isAdd ? 'Penambahan Stok Berjalan' : 'Pengurangan Stok Berjalan'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                {isAdd
                  ? 'Pilih alokasi lokasi dan jumlah penambahan unit masuk'
                  : 'Pilih alokasi lokasi dan jumlah pengurangan unit keluar'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Ringkasan Perangkat */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1.1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '4px' }}>
                  <span className="brand-pill" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    {item.brand}
                  </span>
                  {isSpecialPart && (
                    <span className="badge-status-booking" style={{ padding: '2px 6px' }}>
                      Khusus Part 365K5PA (4 Button)
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {item.name || '-'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                  Part Number: <strong style={{ color: 'var(--text-primary)' }}>{item.partNumber || '-'}</strong>
                </div>
              </div>

              {/* Perhitungan Stok */}
              <div style={{
                textAlign: 'right',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                minWidth: '115px'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Perubahan Stok
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '3px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{currentQty}</span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                  <span style={{
                    fontWeight: 800,
                    color: isAdd ? 'var(--ready-green)' : (resultingQty === 0 ? 'var(--red-critical)' : 'var(--dell-primary)'),
                    fontSize: '1.15rem'
                  }}>
                    {resultingQty}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Pilihan Button (3 Button Umum / 4 Button Khusus 365K5PA) */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.55rem' }}>
              {isAdd ? 'Pilih Kategori Alokasi Penambahan:' : 'Pilih Kategori Alokasi Pengurangan:'}
            </label>

            {/* Tombol Utama */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isSpecialPart ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
              gap: '0.45rem',
              marginBottom: '0.85rem'
            }}>
              {/* Button 1: Lokasi */}
              <button
                type="button"
                className={`reduce-category-btn ${activeCategory === 'lokasi' ? 'active-lokasi' : ''}`}
                onClick={() => setActiveCategory('lokasi')}
              >
                <MapPin size={16} />
                <span>Lokasi</span>
              </button>

              {/* Button 2: Demo */}
              <button
                type="button"
                className={`reduce-category-btn ${activeCategory === 'demo' ? 'active-demo' : ''}`}
                onClick={() => setActiveCategory('demo')}
              >
                <Monitor size={16} />
                <span>Demo</span>
                {breakdown.demo > 0 && (
                  <span className="reduce-btn-badge">
                    ({breakdown.demo})
                  </span>
                )}
              </button>

              {/* Button 3: Service */}
              <button
                type="button"
                className={`reduce-category-btn ${activeCategory === 'service' ? 'active-service' : ''}`}
                onClick={() => setActiveCategory('service')}
              >
                <Wrench size={16} />
                <span>Service</span>
                {breakdown.service > 0 && (
                  <span className="reduce-btn-badge">
                    ({breakdown.service})
                  </span>
                )}
              </button>

              {/* Button 4: Klaim DOA (Hanya Khusus Part Number 365K5PA) */}
              {isSpecialPart && (
                <button
                  type="button"
                  className={`reduce-category-btn ${activeCategory === 'klaim_doa' ? 'active-doa' : ''}`}
                  onClick={() => setActiveCategory('klaim_doa')}
                >
                  <AlertTriangle size={16} />
                  <span>Klaim DOA</span>
                  <span className="reduce-btn-badge">
                    ({breakdown.klaimDoa})
                  </span>
                </button>
              )}
            </div>

            {/* Panel Konten untuk Button yang Aktif */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.85rem'
            }}>
              {/* Opsi Konten 1: LOKASI (Pilihan: Pallazo, IT Talk Surabaya, IT Talk Semarang, IT Talk Ambassador, IT Talk JKT) */}
              {activeCategory === 'lokasi' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                    Pilih Lokasi Gudang Penyimpanan:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: availableWarehouses.length > 4 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
                    gap: '0.4rem',
                    marginBottom: '0.75rem'
                  }}>
                    {availableWarehouses.map((wh) => {
                      const isSelected = selectedLocation === wh.key;
                      const hasStock = wh.count > 0;
                      return (
                        <button
                          key={wh.key}
                          type="button"
                          onClick={() => setSelectedLocation(wh.key)}
                          className={`warehouse-btn ${isSelected ? 'selected' : ''}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                            <span style={{ lineHeight: 1.2 }}>{wh.label}</span>
                          </div>
                          <span className={`warehouse-count ${hasStock ? 'has-stock' : 'empty-stock'}`}>
                            ({wh.count} unit)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter Angka untuk Lokasi */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.79rem', fontWeight: 600, color: '#475569' }}>
                        {isAdd ? 'Jumlah Penambahan:' : 'Jumlah Pengurangan:'}
                      </span>
                      <div style={{
                        fontSize: '0.72rem',
                        color: isSelectedLocationEmpty ? '#DC2626' : (isAdd ? '#16A34A' : '#2563EB'),
                        fontWeight: 600,
                        marginTop: '2px'
                      }}>
                        {isSelectedLocationEmpty ? (
                          '⚠️ Stok di lokasi ini kosong (0 unit)'
                        ) : (
                          `Stok saat ini di ${selectedLocation}: ${breakdown[selectedLocation.toLowerCase().includes('surabaya') ? 'sby' : (selectedLocation.toLowerCase().includes('semarang') ? 'smg' : (selectedLocation.toLowerCase().includes('ambas') ? 'ambas' : (selectedLocation.toLowerCase().includes('jkt') ? 'jkt' : 'pallazo')))] || 0} unit`
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setLokasiQty(Math.max(1, lokasiQty - 1))}
                        disabled={lokasiQty <= 1 || isSelectedLocationEmpty}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxAllowed}
                        value={lokasiQty}
                        disabled={isSelectedLocationEmpty}
                        onChange={(e) => setLokasiQty(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          padding: '3px 4px',
                          borderRadius: '4px',
                          border: isSelectedLocationEmpty ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                          background: isSelectedLocationEmpty ? '#FEF2F2' : '#FFFFFF'
                        }}
                      />
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setLokasiQty(Math.min(maxAllowed, lokasiQty + 1))}
                        disabled={lokasiQty >= maxAllowed || isSelectedLocationEmpty}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>unit</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Opsi Konten 2: DEMO */}
              {activeCategory === 'demo' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>
                        Alokasi Unit Demo
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {breakdown.demo > 0 ? (
                          <span>Stok Demo saat ini: <strong style={{ color: '#B45309' }}>{breakdown.demo} unit</strong></span>
                        ) : (
                          <span>Alokasi: <strong>Display Toko ({selectedLocation})</strong></span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setDemoQty(Math.max(1, demoQty - 1))}
                        disabled={demoQty <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxAllowed}
                        value={demoQty}
                        onChange={(e) => setDemoQty(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          padding: '3px 4px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1'
                        }}
                      />
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setDemoQty(Math.min(maxAllowed, demoQty + 1))}
                        disabled={demoQty >= maxAllowed}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>unit</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    {isAdd
                      ? 'Unit akan ditambahkan ke alokasi Barang Demo Toko / Display.'
                      : 'Unit ini akan dikurangi dari stok dan dialokasikan sebagai Barang Demo Toko / Display.'}
                  </div>
                </div>
              )}

              {/* Opsi Konten 3: SERVICE */}
              {activeCategory === 'service' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6D28D9' }}>
                        Alokasi Unit Service
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        <span>Stok Service saat ini: <strong style={{ color: '#6D28D9' }}>{breakdown.service} unit</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setServiceQty(Math.max(1, serviceQty - 1))}
                        disabled={serviceQty <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxAllowed}
                        value={serviceQty}
                        onChange={(e) => setServiceQty(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          padding: '3px 4px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1'
                        }}
                      />
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setServiceQty(Math.min(maxAllowed, serviceQty + 1))}
                        disabled={serviceQty >= maxAllowed}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>unit</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    {isAdd
                      ? 'Unit akan ditambahkan ke daftar Unit Service Dalam Penanganan.'
                      : 'Unit ini akan dikurangi dari alokasi Unit Service (selesai service atau keluar).'}
                  </div>
                </div>
              )}

              {/* Opsi Konten 4: KLAIM DOA (Hanya Part Number 365K5PA) */}
              {activeCategory === 'klaim_doa' && isSpecialPart && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B91C1C' }}>
                        Alokasi Klaim DOA (Khusus 365K5PA)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Stok Klaim DOA saat ini: <strong style={{ color: '#DC2626' }}>{breakdown.klaimDoa} unit</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setDoaQty(Math.max(1, doaQty - 1))}
                        disabled={doaQty <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxAllowed}
                        value={doaQty}
                        onChange={(e) => setDoaQty(Math.max(1, Math.min(maxAllowed, parseInt(e.target.value, 10) || 1)))}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          padding: '3px 4px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1'
                        }}
                      />
                      <button
                        type="button"
                        className="btn-step"
                        style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                        onClick={() => setDoaQty(Math.min(maxAllowed, doaQty + 1))}
                        disabled={doaQty >= maxAllowed}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>unit</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B91C1C', background: '#FEF2F2', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}>
                    {isAdd
                      ? 'Unit akan dicatat sebagai tambahan unit klaim DOA (Dead On Arrival) ke HP.'
                      : 'Unit dikurangi karena diproses klaim DOA (Dead On Arrival) ke HP.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Audit: Sales/Penerima, No PO, dan Opsi Booking */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem',
            marginBottom: '0.85rem'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserCheck size={15} color="#2563EB" />
              <span>Detail Riwayat Mutasi & Serah Terima:</span>
            </div>

            {/* Opsi jika ada unit yang sedang dibooking / mapping */}
            {!isAdd && itemMappings.length > 0 && (
              <div style={{
                background: isBookingFulfillment ? '#EFF6FF' : '#FEF3C7',
                border: isBookingFulfillment ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                borderRadius: '6px',
                padding: '0.55rem 0.75rem',
                marginBottom: '0.75rem',
                fontSize: '0.75rem',
                color: isBookingFulfillment ? '#1E40AF' : '#92400E',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <div style={{ fontWeight: 700 }}>
                    🏷️ Terdata {existingBooked} unit di-Mapping ({itemMappings.map(m => `${m.sales} [${m.qty}]`).join(', ')})
                  </div>
                  <span style={{ fontSize: '0.71rem', background: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    Ready Bebas: {readyAvailable} unit
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={isBookingFulfillment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsBookingFulfillment(checked);
                      if (checked && activeClosingSales) {
                        if (!actorInput) setActorInput(activeClosingSales.sales);
                        if (!notesInput) setNotesInput(`Closing mapping ${activeClosingSales.sales}`);
                      }
                    }}
                  />
                  <span>Pengambilan ini untuk CLOSING barang mappingan (Deal Sales Closing)</span>
                </label>

                {!isBookingFulfillment ? (
                  <div style={{ fontSize: '0.71rem', color: '#78350F', marginTop: '4px' }}>
                    ℹ️ <strong>Barang Ready yang Dikeluarkan:</strong> Alokasi mapping sales tetap utuh dan TIDAK akan berkurang.
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px dashed #BFDBFE' }}>
                    {itemMappings.length > 1 && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#1E40AF', marginBottom: '2px' }}>
                          Pilih Sales yang Closing:
                        </label>
                        <select
                          className="form-control"
                          style={{ padding: '3px 7px', fontSize: '0.75rem', width: '100%' }}
                          value={selectedClosingSalesId}
                          onChange={(e) => {
                            setSelectedClosingSalesId(e.target.value);
                            const picked = itemMappings.find(m => m.id === e.target.value);
                            if (picked) {
                              setActorInput(picked.sales);
                              setNotesInput(`Closing mapping ${picked.sales}`);
                            }
                          }}
                        >
                          {itemMappings.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.sales} ({m.qty} unit){m.note ? ` - ${m.note}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ fontSize: '0.71rem', color: '#1E40AF' }}>
                      ✓ Mapping <strong>{activeClosingSales?.sales || 'Sales'}</strong> ({activeClosingSales?.qty || 0} unit) akan dikurangi <strong>{currentAdjustAmount} unit</strong> saat disimpan.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {/* Kolom Sales dengan Fitur Filter & Search */}
              <div ref={salesRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  {isAdd ? 'Admin / Penginput:' : 'Sales:'}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={isAdd ? 'Admin Gudang' : 'Cari / ketik nama sales...'}
                    value={actorInput}
                    onFocus={() => !isAdd && setShowSalesDropdown(true)}
                    onChange={(e) => {
                      setActorInput(e.target.value);
                      if (!isAdd) setShowSalesDropdown(true);
                    }}
                    style={{
                      width: '100%',
                      padding: isAdd ? '0.38rem 0.55rem' : '0.38rem 1.8rem 0.38rem 0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: '5px',
                      border: '1px solid #CBD5E1',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  />
                  {!isAdd && (
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
                  )}
                </div>

                {/* Dropdown Hasil Pencarian Sales */}
                {!isAdd && showSalesDropdown && (
                  <div className="modal-dropdown-menu">
                    {filteredSales.length === 0 ? (
                      <div style={{ padding: '6px 10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Tekan enter/simpan untuk sales baru ini
                      </div>
                    ) : (
                      filteredSales.map((salesName, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActorInput(salesName);
                            setShowSalesDropdown(false);
                          }}
                          className={`modal-dropdown-item ${actorInput === salesName ? 'selected' : ''}`}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>👤</span>
                          <span>{salesName}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Kolom No PO / Ref */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  No. PO / Surat Jalan / Ref:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PO-MRDIY-01 / DO-09"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.38rem 0.55rem',
                    fontSize: '0.8rem',
                    borderRadius: '5px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            {/* Kolom Customer dengan Filter & Pencarian Database Neon */}
            <div ref={customerRef} style={{ marginTop: '0.45rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                  {isAdd ? 'Catatan Tambahan (Opsional):' : 'Customer:'}
                </label>
                {!isAdd && customers.length > 0 && (
                  <span style={{ fontSize: '0.67rem', color: '#0284C7', background: '#F0F9FF', padding: '1px 6px', borderRadius: '4px', border: '1px solid #BAE6FD', fontWeight: 600 }}>
                    ⚡ {customers.length} Customer di Database
                  </span>
                )}
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={isAdd ? 'Keterangan penambahan barang...' : 'Ketik nama perusahaan untuk mencari di database...'}
                  value={notesInput}
                  onFocus={() => !isAdd && setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    setNotesInput(e.target.value);
                    if (!isAdd) {
                      setShowCustomerDropdown(true);
                      setSelectedCustomerDetail(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: isAdd ? '0.38rem 0.55rem' : '0.38rem 1.8rem 0.38rem 0.55rem',
                    fontSize: '0.8rem',
                    borderRadius: '5px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                {!isAdd && (
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
                )}
              </div>

              {/* Rangkuman Detail Info Customer yang Sedang Dipilih */}
              {!isAdd && selectedCustomerDetail && (
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
              {!isAdd && showCustomerDropdown && (
                <div className="modal-dropdown-menu" style={{ maxHeight: '210px' }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tidak ditemukan perusahaan &quot;{notesInput}&quot; (akan disimpan sebagai nama baru)
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setNotesInput(c.companyName);
                          setSelectedCustomerDetail(c);
                          setShowCustomerDropdown(false);
                        }}
                        className={`modal-dropdown-item ${notesInput === c.companyName ? 'selected' : ''}`}
                        style={{
                          padding: '7px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Building2 size={13} color="var(--dell-primary)" />
                          <span>{c.companyName}</span>
                        </div>
                        {(c.address || c.contactName || c.phone) && (
                          <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
          </div>

          {/* Kotak Pratinjau Sinkronisasi ke Tabel */}
          <div style={{
            background: isAdd ? '#F0FDF4' : '#F8FAFC',
            border: isAdd ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.75rem 0.85rem',
            marginBottom: '0.85rem'
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: isAdd ? '#15803D' : '#1E293B',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginBottom: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Check size={14} strokeWidth={2.5} />
              <span>Pratinjau Hasil Sinkronisasi ke Tabel:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.81rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#1E293B' }}>
                <MapPin size={14} color="#2563EB" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#475569', fontSize: '0.74rem' }}>LOKASI: </strong>
                  <span style={{ fontWeight: 600 }}>{syncedLocationPreview}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#1E293B' }}>
                <UserCheck size={14} color={existingBooked > 0 ? '#D97706' : '#64748B'} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#475569', fontSize: '0.74rem' }}>BOOKING / MAPPING SALES: </strong>
                  {existingBooked > 0 ? (
                    isBookingFulfillment ? (
                      <span style={{ fontWeight: 600, color: '#2563EB' }}>
                        Mapping {activeClosingSales?.sales} berkurang {currentAdjustAmount} unit (Closing Deal)
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#B45309' }}>
                        {itemMappings.map(m => `${m.sales} (${m.qty})`).join(', ')} <em style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 'normal' }}>(Tetap utuh — yang keluar barang ready, bukan mapping)</em>
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#64748B', fontStyle: 'italic' }}>
                      Tidak ada booking sales (Barang bebas jual)
                    </span>
                  )}
                </div>
              </div>

              {itemKeterangan && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#1E293B', marginTop: '0.2rem' }}>
                  <Info size={14} color="#6366F1" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#475569', fontSize: '0.74rem' }}>KETERANGAN BARANG: </strong>
                    <span style={{ color: '#334155' }}>{itemKeterangan}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Modal dengan Tanda Save */}
          <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.9rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={(!isAdd && currentQty <= 0) || isSelectedLocationEmpty}
              style={{
                background: isSelectedLocationEmpty
                  ? '#94A3B8'
                  : (isAdd ? '#059669' : '#DC2626'),
                borderColor: isSelectedLocationEmpty
                  ? '#94A3B8'
                  : (isAdd ? '#047857' : '#DC2626'),
                gap: '0.45rem',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: isSelectedLocationEmpty ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={16} />
              <span>{isAdd ? 'Simpan Penambahan' : 'Simpan Pengurangan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReduceStockModal;
