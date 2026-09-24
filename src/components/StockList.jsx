import React from 'react';
import { MapPin, UserCheck, Trash2, Edit, Info } from 'lucide-react';
import { getBookedQty, getAvailableQty, parseNotesAndMapping } from '../utils/stockUtils';

const StockList = ({ items, onStockChange, onRequestReduce, onRequestAdd, onDelete, onEdit }) => {
  const formatCategory = (cat) => {
    switch (cat) {
      case 'laptop': return 'Laptop / Notebook';
      case 'pc-desktop': return 'PC Desktop / Tower';
      case 'pc-mini': return 'Mini PC / Micro';
      case 'aio': return 'All-in-One (AIO)';
      case 'server': return 'Server / Workstation';
      default: return cat;
    }
  };

  const getBrandClass = (brand) => {
    if (brand === "DELL") return "dell";
    if (brand === "HP") return "hp";
    if (brand === "DELL LAINNYA") return "other";
    return "";
  };

  return (
    <section className="stock-table-card">
      <div className="table-card-header">
        <div className="table-title-group">
          <h2 className="section-title">Tabel Daftar Stok Berjalan</h2>
          <span className="section-count" id="sectionCountLabel">Menampilkan {items.length} barang</span>
        </div>
        <div className="table-quick-info">
          <span className="info-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
            Klik [ - ] / [ + ] untuk sesuaikan stok & mapping
          </span>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="compact-stock-table" id="stockTable">
          <thead>
            <tr>
              <th style={{width: '44px', textAlign: 'center'}}>No</th>
              <th style={{width: '105px'}}>Brand</th>
              <th style={{width: '125px'}}>Part Number</th>
              <th>Nama Perangkat & Tipe</th>
              <th style={{width: '110px'}}>Kategori</th>
              <th style={{width: '220px'}}>Spesifikasi Ringkas</th>
              <th style={{width: '145px', textAlign: 'center'}}>Stok Berjalan</th>
              <th style={{minWidth: '180px'}}>Lokasi, Mapping & Keterangan</th>
              <th style={{width: '90px', textAlign: 'center'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isSold = item.qty === 0;
              const isLow = item.qty > 0 && item.qty <= 2;
              const qtyClass = isSold ? 'zero' : (isLow ? 'low' : '');
              const booked = getBookedQty(item);
              const available = getAvailableQty(item);
              const { mappings: itemMappings, keterangan: itemKeterangan } = parseNotesAndMapping(item.notes || '');

              return (
                <tr key={item.id} className={isSold ? 'row-sold' : ''}>
                  <td style={{textAlign: 'center', fontWeight: 600, color: '#94A3B8'}}>{index + 1}</td>
                  <td>
                    <span className={`brand-pill ${getBrandClass(item.brand)}`}>
                      {item.brand}
                    </span>
                  </td>
                  <td>
                    <span className="part-number-code">{item.partNumber || '-'}</span>
                  </td>
                  <td>
                    <div className="item-name-cell">{item.name || '-'}</div>
                  </td>
                  <td>
                    <span className="item-category-tag">{formatCategory(item.category)}</span>
                  </td>
                  <td>
                    <div className="item-specs-text">
                      CPU: {item.cpu || '-'}<br/>
                      RAM: {item.ram || '-'} | Storage: {item.storage || '-'}
                    </div>
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <div className="stock-stepper-compact">
                      <button
                        className="btn-step minus"
                        onClick={() => onRequestReduce ? onRequestReduce(item) : onStockChange(item.id, -1)}
                        disabled={item.qty <= 0}
                        title={item.qty <= 0 ? "Stok sudah habis (0)" : "Kurangi stok (Buka Pop Up)"}
                      >
                        -
                      </button>
                      <span className={`step-qty-val ${qtyClass}`}>{item.qty}</span>
                      <button
                        className="btn-step plus"
                        onClick={() => onRequestAdd ? onRequestAdd(item) : onStockChange(item.id, 1)}
                        title="Tambah stok (Buka Pop Up)"
                      >
                        +
                      </button>
                    </div>

                    {/* Indikator Booking & Ready Bebas */}
                    {item.qty > 0 && booked > 0 && (
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: '#B45309',
                          background: '#FEF3C7',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          border: '1px solid #FDE68A'
                        }}>
                          🔒 {booked} Booking
                        </span>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: '#15803D',
                          background: '#DCFCE7',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          border: '1px solid #BBF7D0'
                        }}>
                          ✓ {available} Ready Bebas
                        </span>
                      </div>
                    )}
                    {item.qty > 0 && booked === 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 600,
                          color: '#15803D',
                          background: '#F0FDF4',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          ✓ Bebas Jual
                        </span>
                      </div>
                    )}
                    {item.qty === 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 600,
                          color: '#DC2626',
                          background: '#FEE2E2',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          Habis
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="loc-map-cell">
                      <div className="meta-line meta-loc" title="Lokasi Gudang / Rak">
                        <MapPin size={13} />
                        <span>{item.location || '-'}</span>
                      </div>

                      {/* Mapping Booking Sales: HANYA TAMPIL JIKA BENAR-BENAR ADA BOOKING DARI SALES */}
                      {itemMappings && itemMappings.length > 0 && (
                        <div
                          className="meta-line meta-map"
                          title="Alokasi Booking / Mapping Sales"
                          style={{
                            color: '#B45309',
                            background: '#FEF3C7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content',
                            marginTop: '2px',
                            border: '1px solid #FDE68A'
                          }}
                        >
                          <UserCheck size={12} color="#D97706" />
                          <span style={{ fontWeight: 600 }}>
                            Mapping: {itemMappings.map(m => `${m.sales}${m.note ? ` - ${m.note}` : ''} (${m.qty})`).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Keterangan Tambahan / Spesifikasi Produk (Bukan Mapping) */}
                      {itemKeterangan && (
                        <div
                          className="meta-line meta-note"
                          title="Keterangan Produk"
                          style={{
                            color: '#475569',
                            fontSize: '0.73rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '4px',
                            marginTop: '2px'
                          }}
                        >
                          <Info size={12} color="#64748B" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{itemKeterangan}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-row-action" onClick={() => onEdit(item.id)} title="Edit"><Edit size={13} /></button>
                      <button className="btn-row-action delete" onClick={() => onDelete(item.id)} title="Hapus"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '2rem', color: '#64748B'}}>
                  Tidak ada barang yang cocok dengan filter atau daftar stok kosong.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StockList;
