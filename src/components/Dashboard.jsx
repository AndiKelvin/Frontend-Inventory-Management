import React from 'react';
import { PackageCheck, Laptop, Archive, AlertTriangle, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { getBookedQty, getAvailableQty } from '../utils/stockUtils';

const Dashboard = ({ items }) => {
  const readyItems = items.filter(u => u.qty > 0);
  const totalPhysical = readyItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0);
  const totalBooked = readyItems.reduce((acc, curr) => acc + getBookedQty(curr), 0);
  const totalAvailable = readyItems.reduce((acc, curr) => acc + getAvailableQty(curr), 0);
  const totalModels = new Set(readyItems.map(u => u.partNumber || u.name)).size;

  const dellItems = readyItems.filter(u => u.brand === "DELL");
  const dellReady = dellItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0);

  const hpItems = readyItems.filter(u => u.brand === "HP");
  const hpReady = hpItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0);

  const otherItems = readyItems.filter(u => u.brand === "DELL LAINNYA");
  const otherReady = otherItems.reduce((acc, curr) => acc + (parseInt(curr.qty, 10) || 0), 0);

  const criticalItems = items.filter(u => u.qty > 0 && u.qty <= 2).length;

  return (
    <section className="metrics-grid">
      {/* Total Stok Fisik */}
      <div className="metric-card">
        <div className="metric-icon icon-ready">
          <PackageCheck size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Total Stok Fisik</span>
          <div className="metric-value">{totalPhysical} Unit</div>
          <span className="metric-subtext">{totalModels} Model di Gudang</span>
        </div>
      </div>

      {/* Stok Di-Booking / Mapping (Hold) */}
      <div className="metric-card" style={{ borderLeft: '3px solid #F59E0B' }}>
        <div className="metric-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
          <BookmarkCheck size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Booking (Mapping)</span>
          <div className="metric-value" style={{ color: '#D97706' }}>{totalBooked} Unit</div>
          <span className="metric-subtext">Hold pesanan sales/proyek</span>
        </div>
      </div>

      {/* Stok Ready Bebas Jual */}
      <div className="metric-card" style={{ borderLeft: '3px solid #10B981' }}>
        <div className="metric-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
          <CheckCircle2 size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Ready Bebas Jual</span>
          <div className="metric-value" style={{ color: '#059669' }}>{totalAvailable} Unit</div>
          <span className="metric-subtext">Bebas ditawarkan ke sales</span>
        </div>
      </div>

      {/* Stok Brand DELL */}
      <div className="metric-card">
        <div className="metric-icon icon-dell">
          <Laptop size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Brand DELL</span>
          <div className="metric-value color-dell">{dellReady} Unit</div>
          <span className="metric-subtext">Latitude & Optiplex</span>
        </div>
      </div>

      {/* Stok Brand HP */}
      <div className="metric-card">
        <div className="metric-icon icon-hp">
          <Laptop size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Brand HP</span>
          <div className="metric-value color-hp">{hpReady} Unit</div>
          <span className="metric-subtext">EliteBook, 240 G8/G9, PC</span>
        </div>
      </div>

      {/* Stok DELL Lainnya */}
      <div className="metric-card">
        <div className="metric-icon icon-other">
          <Archive size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok DELL Lainnya</span>
          <div className="metric-value color-other">{otherReady} Unit</div>
          <span className="metric-subtext">Stok Baru Keluaran Lama</span>
        </div>
      </div>

      {/* Stok Kritis */}
      <div className="metric-card">
        <div className="metric-icon icon-kritis">
          <AlertTriangle size={15} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Kritis (≤ 2 Unit)</span>
          <div className="metric-value color-kritis">{criticalItems} Model</div>
          <span className="metric-subtext">Perlu perhatian admin</span>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
