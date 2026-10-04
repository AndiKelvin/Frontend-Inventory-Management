/**
 * TechStock API Service (Frontend Data Layer)
 * Mengelola komunikasi data dengan Backend Server (/api/stock)
 * Dilengkapi proteksi autentikasi PIN dan fallback otomatis jika server tidak aktif.
 */

const TOKEN_STORAGE_KEY = 'techstock_auth_token';

const StockAPI = {
  isServerAvailable: false,

  getToken() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Gagal menyimpan token ke localStorage', e);
    }
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.error('Gagal menghapus token dari localStorage', e);
    }
  },

  hasLocalToken() {
    return !!this.getToken();
  },

  getAuthHeaders(customHeaders = {}) {
    const token = this.getToken();
    const headers = { ...customHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    }
    return headers;
  },

  handleUnauthorized() {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techstock-unauthorized'));
    }
  },

  /**
   * Verifikasi PIN 6 digit ke server
   * @param {string} pin
   * @returns {Promise<{ success: boolean, token?: string, error?: string }>}
   */
  async verifyPin(pin) {
    const cleanPin = String(pin || '').trim();
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.token) {
        this.setToken(data.token);
        this.isServerAvailable = true;
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'PIN yang dimasukkan salah.' };
    } catch {
      // Fallback offline jika server backend tidak dapat dihubungi
      if (cleanPin === '123451') {
        const offlineToken = `offline-token-${Date.now()}`;
        this.setToken(offlineToken);
        return { success: true, token: offlineToken };
      }
      return { success: false, error: 'PIN salah. Akses ditolak.' };
    }
  },

  /**
   * Memeriksa validitas sesi token saat ini
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    const token = this.getToken();
    if (!token) return false;

    // Token offline
    if (token.startsWith('offline-token-')) return true;

    try {
      const res = await fetch('/api/auth/check', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        this.isServerAvailable = true;
        return true;
      }
      if (res.status === 401) {
        this.handleUnauthorized();
        return false;
      }
    } catch {
      // Backend offline sementara
      return true;
    }
    return false;
  },

  /**
   * Mengakhiri sesi / Kunci Aplikasi
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      }).catch(() => {});
    } finally {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techstock-unauthorized'));
      }
    }
  },

  async init() {
    try {
      const res = await fetch('/health', { method: 'GET' });
      if (res.ok) {
        this.isServerAvailable = true;
        console.log('[TechStock API] Terhubung ke Backend Server.');
      }
    } catch {
      this.isServerAvailable = false;
      console.log('[TechStock API] Backend tidak merespon, menggunakan mode LocalStorage.');
    }
  },

  async getAllStock() {
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock', {
          headers: this.getAuthHeaders()
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal fetch dari backend, fallback ke LocalStorage', err);
      }
    }
    const local = localStorage.getItem('techstock_modular_inventory');
    return local ? JSON.parse(local) : null;
  },

  async updateQuantity(id, delta, meta = {}) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock/update-qty', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id, delta, ...meta })
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal update via server, fallback ke local', err);
      }
    }

    const items = await this.getAllStock();
    const target = items ? items.find(u => u.id === id) : null;
    if (target) {
      const oldQty = target.qty || 0;
      const newQty = Math.max(0, oldQty + delta);
      const actualDelta = newQty - oldQty;
      target.qty = newQty;
      target.status = newQty > 0 ? 'ready' : 'sold';
      target.updatedAt = new Date().toISOString();
      localStorage.setItem('techstock_modular_inventory', JSON.stringify(items));

      // Catat mutasi di local jika offline
      if (actualDelta !== 0) {
        this.recordMovement({
          itemId: target.id,
          partNumber: target.partNumber || '-',
          itemName: target.name || 'Unit Tanpa Nama',
          brand: target.brand || 'DELL',
          type: meta.type || (actualDelta > 0 ? 'IN' : 'OUT'),
          amount: Math.abs(actualDelta),
          previousQty: oldQty,
          newQty,
          location: meta.location || target.location || 'Gudang Utama',
          actor: meta.actor || 'Admin Gudang',
          reference: meta.reference || 'QUICK-STEPPER',
          notes: meta.notes || (actualDelta > 0 ? `Penyesuaian stok (+${actualDelta})` : `Penyesuaian stok (${actualDelta})`)
        }).catch(() => {});
      }

      return target;
    }
    return null;
  },

  async saveUnit(unitData) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock/save', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(unitData)
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal simpan ke server, fallback ke local', err);
      }
    }

    let items = (await this.getAllStock()) || [];
    const idx = items.findIndex(u => u.id === unitData.id);
    if (idx >= 0) {
      items[idx] = unitData;
    } else {
      items.unshift(unitData);
    }
    localStorage.setItem('techstock_modular_inventory', JSON.stringify(items));
    return unitData;
  },

  async deleteUnit(id) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch(`/api/stock/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });
        if (res.ok) return true;
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal hapus di server, fallback ke local', err);
      }
    }

    let items = (await this.getAllStock()) || [];
    items = items.filter(u => u.id !== id);
    localStorage.setItem('techstock_modular_inventory', JSON.stringify(items));
    return true;
  },

  async saveAll(items, mode = 'merge') {
    localStorage.setItem('techstock_modular_inventory', JSON.stringify(items));
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock/save-all', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ items, mode })
        });
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal saveAll via server:', err);
      }
    }
    return true;
  },

  async exportExcel() {
    const res = await fetch('/api/stock/export-excel', {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) this.handleUnauthorized();
      throw new Error('Gagal mengunduh file Excel dari server.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const disposition = res.headers.get('content-disposition');
    let filename = `Rekap Stok Barang Hp dan Dell ${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (disposition && disposition.includes('filename=')) {
      const m = disposition.match(/filename="?([^"]+)"?/);
      if (m && m[1]) filename = m[1];
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return filename;
  },

  async exportSmb(brand) {
    const res = await fetch(`/api/stock/export-smb?brand=${encodeURIComponent(brand)}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) this.handleUnauthorized();
      throw new Error('Gagal mengunduh file Excel SMB dari server.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const disposition = res.headers.get('content-disposition');
    let filename = `UPDATE STOCK ${brand.toUpperCase()} SMB.xlsx`;
    if (disposition && disposition.includes('filename=')) {
      const m = disposition.match(/filename="?([^"]+)"?/);
      if (m && m[1]) filename = m[1];
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return filename;
  },

  async exportDistri(brand) {
    const res = await fetch(`/api/stock/export-distri?brand=${encodeURIComponent(brand)}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) this.handleUnauthorized();
      throw new Error('Gagal mengunduh file Excel Distri dari server.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const disposition = res.headers.get('content-disposition');
    let filename = `Laporan Stock ${brand.toUpperCase()} Distri.xlsx`;
    if (disposition && disposition.includes('filename=')) {
      const m = disposition.match(/filename="?([^"]+)"?/);
      if (m && m[1]) filename = m[1];
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return filename;
  },

  async getMovements(filters = {}) {
    if (this.isServerAvailable) {
      try {
        const query = new URLSearchParams();
        if (filters.search) query.append('search', filters.search);
        if (filters.type && filters.type !== 'all') query.append('type', filters.type);
        if (filters.itemId) query.append('itemId', filters.itemId);
        if (filters.limit) query.append('limit', filters.limit);
        const res = await fetch(`/api/stock/movements?${query.toString()}`, {
          headers: this.getAuthHeaders()
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal fetch riwayat mutasi dari backend, fallback ke LocalStorage', err);
      }
    }
    const local = localStorage.getItem('techstock_stock_movements');
    let movements = local ? JSON.parse(local) : [];
    if (filters.type && filters.type !== 'all') {
      movements = movements.filter(m => (m.type || '').toUpperCase() === filters.type.toUpperCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      movements = movements.filter(m =>
        (m.itemName || '').toLowerCase().includes(q) ||
        (m.partNumber || '').toLowerCase().includes(q) ||
        (m.actor || '').toLowerCase().includes(q) ||
        (m.reference || '').toLowerCase().includes(q) ||
        (m.notes || '').toLowerCase().includes(q)
      );
    }
    return movements;
  },

  async recordMovement(data) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock/movements', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(data)
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal simpan mutasi ke backend, fallback ke LocalStorage', err);
      }
    }
    const local = localStorage.getItem('techstock_stock_movements');
    const movements = local ? JSON.parse(local) : [];
    const newEntry = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    movements.unshift(newEntry);
    localStorage.setItem('techstock_stock_movements', JSON.stringify(movements));
    return newEntry;
  },

  async deleteMovement(id) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch(`/api/stock/movements/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });
        if (res.ok) return true;
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal hapus mutasi di server, fallback ke local', err);
      }
    }
    const local = localStorage.getItem('techstock_stock_movements');
    let movements = local ? JSON.parse(local) : [];
    movements = movements.filter(m => String(m.id) !== String(id));
    localStorage.setItem('techstock_stock_movements', JSON.stringify(movements));
    return true;
  },

  async updateMovement(id, updateData) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch(`/api/stock/movements/${id}`, {
          method: 'PUT',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(updateData)
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal update catatan log di server, fallback ke local', err);
      }
    }
    const local = localStorage.getItem('techstock_stock_movements');
    let movements = local ? JSON.parse(local) : [];
    const idx = movements.findIndex(m => String(m.id) === String(id));
    if (idx >= 0) {
      movements[idx] = { ...movements[idx], ...updateData };
      localStorage.setItem('techstock_stock_movements', JSON.stringify(movements));
      return movements[idx];
    }
    return null;
  },

  async getCustomers(search = '') {
    if (this.isServerAvailable) {
      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`/api/stock/customers${query}`, {
          headers: this.getAuthHeaders()
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal fetch customer dari server', err);
      }
    }
    return [];
  },

  async createCustomer(data) {
    if (this.isServerAvailable) {
      const res = await fetch('/api/stock/customers', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal menambahkan customer');
    }
    throw new Error('Server backend tidak aktif');
  },

  async updateCustomer(id, data) {
    if (this.isServerAvailable) {
      const res = await fetch(`/api/stock/customers/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal memperbarui customer');
    }
    throw new Error('Server backend tidak aktif');
  },

  async deleteCustomer(id) {
    if (this.isServerAvailable) {
      const res = await fetch(`/api/stock/customers/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return true;
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal menghapus customer');
    }
    throw new Error('Server backend tidak aktif');
  },

  async getSales() {
    const DEFAULT_SALES = [
      'Bondas', 'Carlo', 'Citra', 'Fungherry', 'Henny',
      'Herry', 'Ibu Lusi', 'Irwin', 'Liza', 'Mukti',
      'Pipit', 'Rama', 'Yussi'
    ];
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/stock/sales', {
          headers: this.getAuthHeaders()
        });
        if (res.ok) return await res.json();
        if (res.status === 401) this.handleUnauthorized();
      } catch (err) {
        console.warn('Gagal fetch sales dari server', err);
      }
    }
    return DEFAULT_SALES;
  },

  async addSales(name) {
    if (this.isServerAvailable) {
      const res = await fetch('/api/stock/sales', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name })
      });
      if (res.ok) return await res.json();
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal menambahkan sales');
    }
    throw new Error('Server backend tidak aktif');
  },

  async saveSales(salesList) {
    if (this.isServerAvailable) {
      const res = await fetch('/api/stock/sales', {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ salesList })
      });
      if (res.ok) return await res.json();
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal menyimpan sales');
    }
    throw new Error('Server backend tidak aktif');
  },

  async deleteSales(name) {
    if (this.isServerAvailable) {
      const res = await fetch(`/api/stock/sales/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
      if (res.status === 401) this.handleUnauthorized();
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Gagal menghapus sales');
    }
    throw new Error('Server backend tidak aktif');
  }
};

export default StockAPI;
