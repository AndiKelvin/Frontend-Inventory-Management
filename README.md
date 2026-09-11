# TechStock Pro - Frontend (React + Vite)

Aplikasi manajemen inventaris stok Laptop & PC berbasis **React** dan **Vite**.

## Fitur
- Dashboard statistik stok (Total unit, Ready, Sold, Low stock alert).
- Tabel interaktif dengan filter pencarian instan berdasarkan Brand, Model, Serial, atau Kategori.
- Penyesuaian cepat kuantitas stok (+ / -) dengan pembaruan instan.
- Form penambahan dan modifikasi data inventaris.
- Antarmuka modern dengan gaya Glassmorphism dan dark mode.

## Prasyarat
- [Node.js](https://nodejs.org/) (v18 ke atas disarankan)
- Backend TechStock Pro (Fastify) berjalan pada port `3000`

## Instalasi & Menjalankan

1. **Clone repository:**
   ```bash
   git clone https://github.com/AndiKelvin/stock-laptop-pc-frontend.git
   cd stock-laptop-pc-frontend
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka di `http://localhost:5173` (atau IP lokal jaringan untuk akses dari perangkat lain).

4. **Build untuk produksi:**
   ```bash
   npm run build
   ```
