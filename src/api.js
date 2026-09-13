/**
 * TechStock API Service (Frontend Data Layer)
 * Mengelola komunikasi data dengan Backend Server (/api/stock)
 * Dilengkapi fallback otomatis ke LocalStorage jika diakses secara standalone / offline.
 */

const StockAPI = {
  isServerAvailable: false,

  async init() {
    try {
      const res = await fetch("/api/stock", { method: "GET" });
      if (res.ok) {
        this.isServerAvailable = true;
        console.log("[TechStock API] Terhubung ke Backend Server lokal.");
      }
    } catch (e) {
      this.isServerAvailable = false;
      console.log("[TechStock API] Backend lokal tidak aktif, menggunakan mode LocalStorage.");
    }
  },

  async getAllStock() {
    if (this.isServerAvailable) {
      try {
        const res = await fetch("/api/stock");
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Gagal fetch dari backend, fallback ke LocalStorage", err);
      }
    }
    const local = localStorage.getItem("techstock_modular_inventory");
    return local ? JSON.parse(local) : null;
  },

  async updateQuantity(id, delta) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch("/api/stock/update-qty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, delta })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Gagal update via server, fallback ke local", err);
      }
    }

    const items = await this.getAllStock();
    const target = items.find(u => u.id === id);
    if (target) {
      const newQty = Math.max(0, target.qty + delta);
      target.qty = newQty;
      target.status = newQty > 0 ? "ready" : "sold";
      target.updatedAt = new Date().toISOString();
      localStorage.setItem("techstock_modular_inventory", JSON.stringify(items));
      return target;
    }
    return null;
  },

  async saveUnit(unitData) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch("/api/stock/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unitData)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Gagal simpan ke server, fallback ke local", err);
      }
    }

    let items = (await this.getAllStock()) || [];
    const idx = items.findIndex(u => u.id === unitData.id);
    if (idx >= 0) {
      items[idx] = unitData;
    } else {
      items.unshift(unitData);
    }
    localStorage.setItem("techstock_modular_inventory", JSON.stringify(items));
    return unitData;
  },

  async deleteUnit(id) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
        if (res.ok) return true;
      } catch (err) {
        console.warn("Gagal hapus di server, fallback ke local", err);
      }
    }

    let items = (await this.getAllStock()) || [];
    items = items.filter(u => u.id !== id);
    localStorage.setItem("techstock_modular_inventory", JSON.stringify(items));
    return true;
  },

  async saveAll(items) {
    localStorage.setItem("techstock_modular_inventory", JSON.stringify(items));
    if (this.isServerAvailable) {
      try {
        await fetch("/api/stock/save-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items)
        });
      } catch (err) {
        console.warn("Gagal saveAll via server:", err);
      }
    }
    return true;
  },

  async exportExcel() {
    const res = await fetch("/api/stock/export-excel");
    if (!res.ok) {
      throw new Error("Gagal mengunduh file Excel dari server.");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const disposition = res.headers.get("content-disposition");
    let filename = `Rekap Stok Barang Hp dan Dell ${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (disposition && disposition.includes("filename=")) {
      const m = disposition.match(/filename="?([^"]+)"?/);
      if (m && m[1]) filename = m[1];
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return filename;
  }
};

export default StockAPI;
