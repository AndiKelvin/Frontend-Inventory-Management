import React, { useState, useEffect, useMemo } from 'react';
import { X, Building2, Users, Search, Plus, Edit2, Trash2, Check, Phone, MapPin, User, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import StockAPI from '../api';
import ConfirmDialog from './ConfirmDialog';
import { parseNotesAndMapping } from '../utils/stockUtils';

export default function MasterDataModal({ show, onClose, items = [], onDataChanged }) {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'sales'

  // =================== STATE CUSTOMERS ===================
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Form Customer (Tambah / Edit)
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerFormData, setCustomerFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    address: '',
  });
  const [customerFormError, setCustomerFormError] = useState('');
  const [submittingCustomer, setSubmittingCustomer] = useState(false);

  // =================== STATE SALES ===================
  const [salesList, setSalesList] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [newSalesName, setNewSalesName] = useState('');
  const [salesError, setSalesError] = useState('');
  const [editingSalesName, setEditingSalesName] = useState(null);
  const [editSalesInput, setEditSalesInput] = useState('');

  // =================== CONFIRM DIALOG STATE ===================
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Hapus',
    onConfirm: () => {},
  });

  // Fetch Customers & Sales saat modal dibuka
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await StockAPI.getCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data customer:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const data = await StockAPI.getSales();
      if (Array.isArray(data)) {
        setSalesList(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data sales:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchCustomers();
      fetchSales();
      setShowCustomerForm(false);
      setEditingCustomer(null);
      setCustomerSearch('');
      setCurrentPage(1);
      setNewSalesName('');
      setEditingSalesName(null);
    }
  }, [show]);

  // Shortcut tombol Esc
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDialog.show) {
          setConfirmDialog(prev => ({ ...prev, show: false }));
        } else if (showCustomerForm) {
          setShowCustomerForm(false);
          setEditingCustomer(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, confirmDialog.show, showCustomerForm, onClose]);

  // Hitung berapa booking aktif per sales berdasarkan items inventaris
  const salesBookingCounts = useMemo(() => {
    const counts = {};
    (items || []).forEach(item => {
      if (!item.notes) return;
      const { mappings } = parseNotesAndMapping(item.notes);
      mappings.forEach(m => {
        const sName = (m.sales || '').trim().toLowerCase();
        if (sName) {
          counts[sName] = (counts[sName] || 0) + (parseInt(m.qty, 10) || 0);
        }
      });
    });
    return counts;
  }, [items]);

  // Filter customers berdasarkan query
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.contactName || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // =================== HANDLERS CUSTOMER ===================
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({ companyName: '', contactName: '', phone: '', address: '' });
    setCustomerFormError('');
    setShowCustomerForm(true);
  };

  const handleOpenEditCustomer = (cust) => {
    setEditingCustomer(cust);
    setCustomerFormData({
      companyName: cust.companyName || '',
      contactName: cust.contactName || '',
      phone: cust.phone || '',
      address: cust.address || '',
    });
    setCustomerFormError('');
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const name = customerFormData.companyName.trim();
    if (!name) {
      setCustomerFormError('Nama perusahaan/klien wajib diisi.');
      return;
    }

    setSubmittingCustomer(true);
    setCustomerFormError('');
    try {
      if (editingCustomer) {
        const updated = await StockAPI.updateCustomer(editingCustomer.id, customerFormData);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await StockAPI.createCustomer(customerFormData);
        setCustomers(prev => [created, ...prev]);
      }
      setShowCustomerForm(false);
      setEditingCustomer(null);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setCustomerFormError(err.message || 'Gagal menyimpan data customer');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = (cust) => {
    setConfirmDialog({
      show: true,
      title: 'Hapus Customer?',
      message: `Hapus "${cust.companyName}" dari master database customer?`,
      type: 'danger',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          await StockAPI.deleteCustomer(cust.id);
          setCustomers(prev => prev.filter(c => c.id !== cust.id));
          if (onDataChanged) onDataChanged();
        } catch (err) {
          console.error('Gagal hapus customer:', err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      },
    });
  };

  // =================== HANDLERS SALES ===================
  const handleAddSales = async (e) => {
    e.preventDefault();
    const name = newSalesName.trim();
    if (!name) {
      setSalesError('Nama sales tidak boleh kosong.');
      return;
    }
    if (salesList.some(s => s.toLowerCase() === name.toLowerCase())) {
      setSalesError(`Sales "${name}" sudah terdaftar.`);
      return;
    }

    try {
      setSalesError('');
      const updated = await StockAPI.addSales(name);
      setSalesList(updated);
      setNewSalesName('');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setSalesError(err.message || 'Gagal menambahkan sales');
    }
  };

  const handleStartEditSales = (name) => {
    setEditingSalesName(name);
    setEditSalesInput(name);
  };

  const handleSaveEditSales = async (oldName) => {
    const newName = editSalesInput.trim();
    if (!newName) return;
    if (newName.toLowerCase() === oldName.toLowerCase()) {
      setEditingSalesName(null);
      return;
    }

    const updatedList = salesList.map(s => s === oldName ? newName : s);
    try {
      const res = await StockAPI.saveSales(updatedList);
      setSalesList(res);
      setEditingSalesName(null);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Gagal update sales:', err);
    }
  };

  const handleDeleteSales = (name) => {
    const booked = salesBookingCounts[name.toLowerCase()] || 0;
    const warningMsg = booked > 0
      ? `Perhatian: Sales "${name}" saat ini memiliki ${booked} unit booking aktif di daftar stok! Hapus tetap nama sales ini?`
      : `Hapus "${name}" dari master daftar sales?`;

    setConfirmDialog({
      show: true,
      title: 'Hapus Sales?',
      message: warningMsg,
      type: 'danger',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const updated = await StockAPI.deleteSales(name);
          setSalesList(updated);
          if (onDataChanged) onDataChanged();
        } catch (err) {
          console.error('Gagal hapus sales:', err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      },
    });
  };

  if (!show) return null;

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          zIndex: 8000,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-container"
          style={{
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '1.2rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Master Data Sistem
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                  Kelola database Customer (Klien) dan Tim Sales untuk mapping serah terima
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: '4px',
                borderRadius: '6px',
              }}
              title="Tutup (Escape)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Segmented Tabs */}
          <div style={{ padding: '0.8rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === 'customers' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                background: activeTab === 'customers' ? '#EFF6FF' : '#FFFFFF',
                color: activeTab === 'customers' ? '#1D4ED8' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <Building2 size={16} />
              <span>Master Customer</span>
              <span
                style={{
                  background: activeTab === 'customers' ? '#DBEAFE' : '#F1F5F9',
                  color: activeTab === 'customers' ? '#1E40AF' : '#64748B',
                  padding: '1px 6px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                }}
              >
                {customers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === 'sales' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                background: activeTab === 'sales' ? '#EFF6FF' : '#FFFFFF',
                color: activeTab === 'sales' ? '#1D4ED8' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={16} />
              <span>Master Sales</span>
              <span
                style={{
                  background: activeTab === 'sales' ? '#DBEAFE' : '#F1F5F9',
                  color: activeTab === 'sales' ? '#1E40AF' : '#64748B',
                  padding: '1px 6px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                }}
              >
                {salesList.length}
              </span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', background: '#F8FAFC' }}>
            {/* ===================== TAB CUSTOMER ===================== */}
            {activeTab === 'customers' && (
              <div>
                {/* Action Bar (Search & Tambah) */}
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Cari PT, Instansi, PIC, Telepon..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ paddingLeft: '32px', width: '100%', fontSize: '0.84rem' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenAddCustomer}
                    style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={16} />
                    <span>+ Tambah Customer</span>
                  </button>
                </div>

                {/* Form Tambah/Edit Customer (Collapsible Card) */}
                {showCustomerForm && (
                  <form
                    onSubmit={handleSaveCustomer}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '12px',
                      padding: '1.2rem',
                      marginBottom: '1.2rem',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#1E40AF', fontWeight: 700 }}>
                        {editingCustomer ? `Edit Customer: ${editingCustomer.companyName}` : 'Tambah Customer Baru'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowCustomerForm(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {customerFormError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.8rem', border: '1px solid #FECACA' }}>
                        <AlertCircle size={14} />
                        <span>{customerFormError}</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Nama Perusahaan / Instansi *
                        </label>
                        <input
                          type="text"
                          className="custom-input"
                          required
                          placeholder="PT ABC Nusantara / SMA ..."
                          value={customerFormData.companyName}
                          onChange={(e) => setCustomerFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          style={{ width: '100%', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Contact Person (PIC)
                        </label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Bpk. Hendra / Ibu Ratna"
                          value={customerFormData.contactName}
                          onChange={(e) => setCustomerFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          style={{ width: '100%', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          No. Telepon / WhatsApp
                        </label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="0812-xxxx-xxxx"
                          value={customerFormData.phone}
                          onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                          style={{ width: '100%', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Alamat Kantor / Pengiriman
                        </label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Jl. Thamrin No. 12, Jakarta"
                          value={customerFormData.address}
                          onChange={(e) => setCustomerFormData(prev => ({ ...prev, address: e.target.value }))}
                          style={{ width: '100%', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowCustomerForm(false)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingCustomer}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                      >
                        {submittingCustomer ? 'Menyimpan...' : 'Simpan Customer'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tabel Customers */}
                <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="compact-stock-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                          <th style={{ minWidth: '180px' }}>Nama Perusahaan</th>
                          <th style={{ width: '150px' }}>PIC</th>
                          <th style={{ width: '130px' }}>Telepon</th>
                          <th>Alamat</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingCustomers ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                              <RefreshCw size={18} className="spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                              Memuat data customer...
                            </td>
                          </tr>
                        ) : paginatedCustomers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                              Tidak ada data customer yang cocok.
                            </td>
                          </tr>
                        ) : (
                          paginatedCustomers.map((cust, idx) => (
                            <tr key={cust.id}>
                              <td style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                                {(currentPage - 1) * PAGE_SIZE + idx + 1}
                              </td>
                              <td style={{ fontWeight: 600, color: '#0F172A' }}>
                                {cust.companyName}
                              </td>
                              <td>
                                {cust.contactName ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                                    <User size={12} color="#64748B" />
                                    {cust.contactName}
                                  </span>
                                ) : (
                                  <span style={{ color: '#CBD5E1' }}>-</span>
                                )}
                              </td>
                              <td>
                                {cust.phone ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 500 }}>
                                    <Phone size={12} />
                                    {cust.phone}
                                  </span>
                                ) : (
                                  <span style={{ color: '#CBD5E1' }}>-</span>
                                )}
                              </td>
                              <td style={{ color: '#64748B', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cust.address ? (
                                  <span title={cust.address} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color="#94A3B8" />
                                    {cust.address}
                                  </span>
                                ) : (
                                  <span style={{ color: '#CBD5E1' }}>-</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCustomer(cust)}
                                    className="btn-row-action"
                                    title="Edit Customer"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomer(cust)}
                                    className="btn-row-action delete"
                                    title="Hapus Customer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        padding: '0.6rem 1rem',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FAFAFA',
                        fontSize: '0.78rem',
                        color: '#64748B',
                      }}
                    >
                      <span>
                        Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} dari {filteredCustomers.length} customer
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span>Hal {currentPage} / {totalPages}</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== TAB SALES ===================== */}
            {activeTab === 'sales' && (
              <div>
                {/* Form Tambah Sales */}
                <form
                  onSubmit={handleAddSales}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.2rem',
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="Ketik nama sales baru (contoh: Doni, Kak Rere)..."
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    style={{ flex: 1, fontSize: '0.84rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={16} />
                    <span>+ Tambah Sales</span>
                  </button>
                </form>

                {salesError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.8rem', border: '1px solid #FECACA' }}>
                    <AlertCircle size={14} />
                    <span>{salesError}</span>
                  </div>
                )}

                {/* Sales Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem' }}>
                  {loadingSales ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      <RefreshCw size={18} className="spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                      Memuat daftar sales...
                    </div>
                  ) : salesList.map((salesName) => {
                    const bookedCount = salesBookingCounts[salesName.toLowerCase()] || 0;
                    const isEditing = editingSalesName === salesName;

                    return (
                      <div
                        key={salesName}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.6rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {salesName.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="custom-input"
                                  value={editSalesInput}
                                  onChange={(e) => setEditSalesInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditSales(salesName);
                                    if (e.key === 'Escape') setEditingSalesName(null);
                                  }}
                                  autoFocus
                                  style={{ padding: '2px 6px', fontSize: '0.8rem', width: '100%' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditSales(salesName)}
                                  style={{ background: '#10B981', border: 'none', color: '#FFF', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {salesName}
                                </div>
                                {bookedCount > 0 ? (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>
                                    {bookedCount} booking aktif
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                                    0 booking
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {!isEditing && (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditSales(salesName)}
                              className="btn-row-action"
                              title="Edit Nama"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSales(salesName)}
                              className="btn-row-action delete"
                              title="Hapus Sales"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}
