import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportExcelModal = ({ show, onClose, currentItems, onImportSuccess }) => {
  const [fileData, setFileData] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!show) return null;

  // Template Excel Standar untuk diunduh user
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Brand': 'DELL',
        'Part Number': 'GA3440I5V3',
        'Nama Perangkat': 'Latitude 3440-i51335U-16GB-512GB-W11P',
        'Kategori': 'laptop',
        'Processor': 'Intel Core i5-1335U',
        'RAM': '16GB',
        'Storage': '512GB SSD',
        'Qty': 5,
        'Lokasi': 'Pallazo (5)',
        'Catatan / Mapping': 'MAPPING: Stock Ready'
      },
      {
        'Brand': 'HP',
        'Part Number': '6K2W4PA',
        'Nama Perangkat': 'HP 240 G9 Notebook PC',
        'Kategori': 'laptop',
        'Processor': 'Intel Core i3-1215U',
        'RAM': '8GB',
        'Storage': '512GB SSD',
        'Qty': 10,
        'Lokasi': 'Pallazo (10)',
        'Catatan / Mapping': 'Stok Baru Gudang'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Stok');
    XLSX.writeFile(workbook, 'Template_Import_Stok_Inventaris.xlsx');
  };

  // Membaca file yang diupload (XLSX / XLS / CSV)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          throw new Error('File Excel tidak memiliki baris data atau kosong.');
        }

        // Deteksi baris header
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, rawJson.length); i++) {
          const row = rawJson[i];
          if (Array.isArray(row) && row.some(cell => typeof cell === 'string' && /part|brand|nama|model|qty|stok/i.test(cell))) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rawJson[headerRowIdx].map(h => String(h || '').trim());
        const dataRows = rawJson.slice(headerRowIdx + 1);

        // Helper mencari indeks kolom
        const findColIndex = (patterns) => {
          return headers.findIndex(h => patterns.some(p => p.test(h)));
        };

        const colBrand = findColIndex([/^brand$/i, /^merk$/i, /^merek$/i]);
        const colPartNumber = findColIndex([/part\s*number/i, /^pn$/i, /^kode$/i, /^sku$/i, /part\s*id/i]);
        const colName = findColIndex([/^nama/i, /^model$/i, /^tipe$/i, /^item$/i, /^deskripsi$/i, /^description$/i]);
        const colCategory = findColIndex([/^kategori$/i, /^category$/i, /^jenis$/i]);
        const colCpu = findColIndex([/^cpu$/i, /^proc/i, /processor/i]);
        const colRam = findColIndex([/^ram$/i, /^memory$/i, /^memori$/i]);
        const colStorage = findColIndex([/^storage$/i, /^ssd$/i, /^hdd$/i, /^disk$/i]);
        const colQty = findColIndex([/^qty$/i, /^jumlah$/i, /^stok$/i, /^total$/i, /^quantity$/i]);
        const colLoc = findColIndex([/^lokasi$/i, /^gudang$/i, /^location$/i]);
        const colNotes = findColIndex([/^catatan$/i, /^notes$/i, /^mapping$/i, /^keterangan$/i]);

        const formatted = [];
        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return;

          const partNumber = colPartNumber >= 0 && row[colPartNumber] ? String(row[colPartNumber]).trim() : '';
          const rawName = colName >= 0 && row[colName] ? String(row[colName]).trim() : '';
          const rawBrand = colBrand >= 0 && row[colBrand] ? String(row[colBrand]).trim().toUpperCase() : '';

          // Jika baris kosong (tidak ada nama dan part number), lewati
          if (!rawName && !partNumber) return;

          const brand = rawBrand || (rawName.toLowerCase().includes('dell') ? 'DELL' : (rawName.toLowerCase().includes('hp') ? 'HP' : 'DELL'));
          const qty = colQty >= 0 ? parseInt(row[colQty], 10) || 0 : 1;
          const cpu = colCpu >= 0 && row[colCpu] ? String(row[colCpu]).trim() : '-';
          const ram = colRam >= 0 && row[colRam] ? String(row[colRam]).trim() : '-';
          const storage = colStorage >= 0 && row[colStorage] ? String(row[colStorage]).trim() : '-';
          const location = colLoc >= 0 && row[colLoc] ? String(row[colLoc]).trim() : `Pallazo (${qty})`;
          const notes = colNotes >= 0 && row[colNotes] ? String(row[colNotes]).trim() : `MAPPING: Stock Ready (${qty})`;

          let category = 'laptop';
          if (colCategory >= 0 && row[colCategory]) {
            const c = String(row[colCategory]).toLowerCase();
            if (c.includes('desktop') || c.includes('tower') || c.includes('pc')) category = 'pc-desktop';
            else if (c.includes('mini') || c.includes('micro')) category = 'pc-mini';
            else if (c.includes('aio') || c.includes('all-in-one')) category = 'aio';
          } else {
            const n = rawName.toLowerCase();
            if (n.includes('optiplex') || n.includes('tower') || n.includes('desktop')) category = 'pc-desktop';
            else if (n.includes('mini') || n.includes('micro')) category = 'pc-mini';
            else if (n.includes('aio')) category = 'aio';
          }

          const id = partNumber
            ? `${brand.toLowerCase()}-${partNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            : `unit-${Date.now()}-${idx}`;

          formatted.push({
            id,
            brand,
            partNumber: partNumber || `AUTO-${idx + 1}`,
            name: rawName || `Perangkat ${partNumber}`,
            category,
            cpu,
            ram,
            storage,
            qty,
            status: qty > 0 ? 'ready' : 'sold',
            location,
            notes,
            updatedAt: new Date().toISOString()
          });
        });

        if (formatted.length === 0) {
          throw new Error('Tidak ada data barang yang valid terbaca dari file ini.');
        }

        setFileData({ name: file.name, totalFound: formatted.length });
        setParsedRows(formatted);
        setSelectedIndices(new Set(formatted.map((_, i) => i)));
      } catch (err) {
        console.error('Error membaca file Excel:', err);
        setErrorMessage(err.message || 'Gagal membaca format file Excel.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === parsedRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const handleToggleRow = (index) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const handleExecuteImport = () => {
    const selectedItems = parsedRows.filter((_, idx) => selectedIndices.has(idx));
    if (selectedItems.length === 0) {
      setErrorMessage('Pilih minimal 1 baris barang untuk di-import.');
      return;
    }

    let finalItems = [];
    if (importMode === 'replace') {
      finalItems = selectedItems;
    } else {
      // Merge mode
      finalItems = [...currentItems];
      selectedItems.forEach(newItem => {
        const existIdx = finalItems.findIndex(e =>
          (e.partNumber && newItem.partNumber && e.partNumber.trim().toUpperCase() === newItem.partNumber.trim().toUpperCase()) ||
          e.id === newItem.id
        );

        if (existIdx >= 0) {
          // Update data yang ada
          finalItems[existIdx] = {
            ...finalItems[existIdx],
            ...newItem,
            id: finalItems[existIdx].id
          };
        } else {
          finalItems.unshift(newItem);
        }
      });
    }

    onImportSuccess(finalItems, selectedItems.length, importMode);
    onClose();
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box" style={{ maxWidth: '880px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Modal */}
        <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#DCFCE7',
              color: '#16A34A',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Import Data Stok dari Excel / CSV
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Unggah file rekap stok barang untuk otomatis dimasukkan ke dalam web
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

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 0' }}>
          {errorMessage && (
            <div style={{
              background: '#FEE2E2',
              color: '#991B1B',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Area Upload File */}
          {!fileData ? (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #93C5FD',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Upload size={38} color="#2563EB" style={{ margin: '0 auto 0.6rem', display: 'block' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>
                  Klik untuk Memilih File Excel (.xlsx / .xls / .csv)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Mendukung file rekap stok standar dengan kolom Brand, Part Number, Nama, Spek, Qty, dan Lokasi
                </div>
              </div>

              {/* Download Template Box */}
              <div style={{
                marginTop: '1.25rem',
                background: '#F1F5F9',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem'
              }}>
                <div>
                  <strong style={{ color: '#1E293B' }}>Belum punya format file yang cocok?</strong>
                  <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                    Unduh template kosong Excel dengan susunan kolom standar kami.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} />
                  <span>Download Template</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* File Info Bar & Mode Selector */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E40AF' }}>
                    📄 {fileData.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#3B82F6' }}>
                    Terdeteksi <strong>{parsedRows.length}</strong> unit barang siap di-import
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFileData(null);
                      setParsedRows([]);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Mode Import */}
              <div style={{
                marginBottom: '0.9rem',
                background: '#F8FAFC',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem' }}>
                  PILIH METODE IMPORT:
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <span><strong>Gabungkan / Update (Merge):</strong> Part Number yang sama diupdate, barang baru ditambahkan</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span style={{ color: '#DC2626' }}><strong>Gantikan Semua:</strong> Hapus data lama dan ganti 100% dengan file ini</span>
                  </label>
                </div>
              </div>

              {/* Tabel Pratinjau */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Pratinjau Data ({selectedIndices.size} dari {parsedRows.length} dipilih):
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {selectedIndices.size === parsedRows.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <table className="compact-stock-table" style={{ width: '100%', fontSize: '0.76rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                    <tr>
                      <th style={{ width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === parsedRows.length && parsedRows.length > 0}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                      <th style={{ width: '80px' }}>Brand</th>
                      <th style={{ width: '110px' }}>Part Number</th>
                      <th>Nama Perangkat</th>
                      <th style={{ width: '180px' }}>Spek (CPU / RAM / SSD)</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                      <th>Lokasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} style={{ background: selectedIndices.has(idx) ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(idx)}
                            onChange={() => handleToggleRow(idx)}
                          />
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: row.brand === 'DELL' ? '#EFF6FF' : '#F0F9FF',
                            color: row.brand === 'DELL' ? '#1D4ED8' : '#0284C7'
                          }}>
                            {row.brand}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0284C7' }}>
                          {row.partNumber}
                        </td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>
                          {row.name}
                        </td>
                        <td style={{ color: '#475569' }}>
                          {row.cpu} | {row.ram} | {row.storage}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                          {row.qty}
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.72rem' }}>
                          {row.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          {fileData && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedIndices.size === 0 || isProcessing}
              onClick={handleExecuteImport}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <CheckCircle2 size={16} />
              <span>
                {importMode === 'replace' ? 'Gantikan & Import' : 'Import'} ({selectedIndices.size} Unit)
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;
