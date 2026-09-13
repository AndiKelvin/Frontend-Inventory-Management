import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Monitor, Wrench, AlertTriangle, ArrowRight, Check, UserCheck, PlusCircle } from 'lucide-react';

/**
 * Helper untuk mengurai akumulasi stok per lokasi/kategori dari data item
 */
export const parseLocationBreakdown = (item) => {
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

  useEffect(() => {
    if (item) {
      setActiveCategory('lokasi');
      setLokasiQty(1);
      setDemoQty(1);
      setServiceQty(1);
      setDoaQty(1);

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

  // Hitung teks Lokasi dan Mapping secara dinamis dan tersinkronisasi untuk SEMUA BARANG
  const getSyncedOutputs = () => {
    if (!isAdd && resultingQty === 0) {
      return {
        locationText: `Habis (0) - Terakhir di ${selectedLocation}`,
        mappingText: `MAPPING: Take Out ${currentAdjustAmount} unit dari ${selectedLocation} (Stok Habis)`
      };
    }

    // Kasus khusus 365K5PA
    if (isSpecialPart) {
      let remPallazo = breakdown.pallazo;
      let remKlaim = breakdown.klaimDoa;
      let remService = breakdown.service;
      let mappingText = '';

      if (isAdd) {
        if (activeCategory === 'lokasi') {
          if (selectedLocation === 'Pallazo') {
            remPallazo += currentAdjustAmount;
            mappingText = `MAPPING: Masuk ${currentAdjustAmount} unit ke Pallazo (Total Pallazo: ${remPallazo})`;
          } else {
            mappingText = `MAPPING: Masuk ${currentAdjustAmount} unit ke ${selectedLocation} (Total: ${currentAdjustAmount})`;
          }
        } else if (activeCategory === 'demo') {
          mappingText = `DEMO: Masuk ${currentAdjustAmount} unit ke Display Toko`;
        } else if (activeCategory === 'service') {
          remService += currentAdjustAmount;
          mappingText = `SERVICES: Masuk ${currentAdjustAmount} unit ke Service (Total Service: ${remService})`;
        } else if (activeCategory === 'klaim_doa') {
          remKlaim += currentAdjustAmount;
          mappingText = `KLAIM DOA: Masuk ${currentAdjustAmount} unit klaim DOA (Total: ${remKlaim})`;
        }
      } else {
        if (activeCategory === 'lokasi') {
          remPallazo = Math.max(0, remPallazo - currentAdjustAmount);
          mappingText = `MAPPING: Take Out ${currentAdjustAmount} unit dari Pallazo (Sisa Pallazo: ${remPallazo})`;
        } else if (activeCategory === 'demo') {
          remPallazo = Math.max(0, remPallazo - currentAdjustAmount);
          mappingText = `DEMO: ${currentAdjustAmount} unit dialokasikan ke Display Toko (Sisa Pallazo: ${remPallazo})`;
        } else if (activeCategory === 'service') {
          remService = Math.max(0, remService - currentAdjustAmount);
          mappingText = `SERVICES: ${currentAdjustAmount} unit keluar service (Sisa Service: ${remService})`;
        } else if (activeCategory === 'klaim_doa') {
          remKlaim = Math.max(0, remKlaim - currentAdjustAmount);
          mappingText = `KLAIM DOA: ${currentAdjustAmount} unit diproses ke HP (Sisa Klaim DOA: ${remKlaim})`;
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

      let updatedMapping = '';
      if (isAdd) {
        if (activeCategory === 'demo') {
          updatedMapping = `DEMO: Masuk ${currentAdjustAmount} unit ke Display Toko (Total: ${newCount})`;
        } else if (activeCategory === 'service') {
          updatedMapping = `SERVICES: Masuk ${currentAdjustAmount} unit ke Service (Total Service: ${newCount})`;
        } else {
          updatedMapping = `MAPPING: Masuk ${currentAdjustAmount} unit ke ${targetLabel} (Total ${targetLabel}: ${newCount})`;
        }
      } else {
        if (activeCategory === 'demo') {
          updatedMapping = `DEMO: ${currentAdjustAmount} unit dialokasikan ke Display Toko (Sisa: ${newCount})`;
        } else if (activeCategory === 'service') {
          updatedMapping = `SERVICES: ${currentAdjustAmount} unit keluar service (Sisa Service: ${newCount})`;
        } else {
          updatedMapping = `MAPPING: Take Out ${currentAdjustAmount} unit dari ${targetLabel} (Sisa ${targetLabel}: ${newCount})`;
        }
      }

      return { locationText: updatedLocation, mappingText: updatedMapping };
    }

    // Jika lokasi belum ada di string saat penambahan
    if (isAdd) {
      const updatedLocation = cleanLoc ? `${cleanLoc}, ${targetLabel} (${currentAdjustAmount})` : `${targetLabel} (${currentAdjustAmount})`;
      const updatedMapping = `MAPPING: Masuk ${currentAdjustAmount} unit ke ${targetLabel} (Total: ${currentAdjustAmount})`;
      return { locationText: updatedLocation, mappingText: updatedMapping };
    }

    // Fallback jika tidak ada segmen kurung dalam lokasi asli saat pengurangan
    return {
      locationText: `${targetLabel} (${resultingQty})`,
      mappingText: `MAPPING: Take Out ${currentAdjustAmount} unit dari ${targetLabel} (Sisa: ${resultingQty})`
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
      mode
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
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
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
                    <span style={{
                      fontSize: '0.68rem',
                      background: '#FEF3C7',
                      color: '#B45309',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      Khusus Part 365K5PA (4 Button)
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A', marginTop: '2px' }}>
                  {item.name || '-'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>
                  Part Number: <strong style={{ color: '#1E293B' }}>{item.partNumber || '-'}</strong>
                </div>
              </div>

              {/* Perhitungan Stok */}
              <div style={{
                textAlign: 'right',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                minWidth: '115px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Perubahan Stok
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '3px' }}>
                  <span style={{ fontWeight: 700, color: '#334155', fontSize: '1.05rem' }}>{currentQty}</span>
                  <ArrowRight size={13} color="#94A3B8" />
                  <span style={{
                    fontWeight: 800,
                    color: isAdd ? '#16A34A' : (resultingQty === 0 ? '#EF4444' : '#2563EB'),
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
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '0.55rem' }}>
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
                onClick={() => setActiveCategory('lokasi')}
                style={{
                  padding: '0.55rem 0.35rem',
                  border: activeCategory === 'lokasi' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: activeCategory === 'lokasi' ? '#EFF6FF' : '#FFFFFF',
                  color: activeCategory === 'lokasi' ? '#1D4ED8' : '#475569',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapPin size={16} color={activeCategory === 'lokasi' ? '#2563EB' : '#64748B'} />
                <span>Lokasi</span>
              </button>

              {/* Button 2: Demo */}
              <button
                type="button"
                onClick={() => setActiveCategory('demo')}
                style={{
                  padding: '0.55rem 0.35rem',
                  border: activeCategory === 'demo' ? '2px solid #D97706' : '1px solid #CBD5E1',
                  background: activeCategory === 'demo' ? '#FFFBEB' : '#FFFFFF',
                  color: activeCategory === 'demo' ? '#B45309' : '#475569',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Monitor size={16} color={activeCategory === 'demo' ? '#D97706' : '#64748B'} />
                <span>Demo</span>
                {breakdown.demo > 0 && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#D97706' }}>
                    ({breakdown.demo})
                  </span>
                )}
              </button>

              {/* Button 3: Service */}
              <button
                type="button"
                onClick={() => setActiveCategory('service')}
                style={{
                  padding: '0.55rem 0.35rem',
                  border: activeCategory === 'service' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                  background: activeCategory === 'service' ? '#F5F3FF' : '#FFFFFF',
                  color: activeCategory === 'service' ? '#6D28D9' : '#475569',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Wrench size={16} color={activeCategory === 'service' ? '#7C3AED' : '#64748B'} />
                <span>Service</span>
                {breakdown.service > 0 && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7C3AED' }}>
                    ({breakdown.service})
                  </span>
                )}
              </button>

              {/* Button 4: Klaim DOA (Hanya Khusus Part Number 365K5PA) */}
              {isSpecialPart && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('klaim_doa')}
                  style={{
                    padding: '0.55rem 0.35rem',
                    border: activeCategory === 'klaim_doa' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                    background: activeCategory === 'klaim_doa' ? '#FEF2F2' : '#FFFFFF',
                    color: activeCategory === 'klaim_doa' ? '#B91C1C' : '#475569',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <AlertTriangle size={16} color={activeCategory === 'klaim_doa' ? '#DC2626' : '#64748B'} />
                  <span>Klaim DOA</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#DC2626' }}>
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
                          style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: '6px',
                            border: isSelected ? '2px solid #2563EB' : '1px solid #CBD5E1',
                            background: isSelected ? '#2563EB' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : (hasStock ? '#334155' : '#94A3B8'),
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.15rem',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                            <span style={{ lineHeight: 1.2 }}>{wh.label}</span>
                          </div>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 600,
                            opacity: isSelected ? 0.95 : 0.8,
                            color: isSelected ? '#FFFFFF' : (hasStock ? '#16A34A' : '#94A3B8')
                          }}>
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
                <UserCheck size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#475569', fontSize: '0.74rem' }}>MAPPING: </strong>
                  <span style={{ fontWeight: 600 }}>{syncedMappingPreview}</span>
                </div>
              </div>
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
