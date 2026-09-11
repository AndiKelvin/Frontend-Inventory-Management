import React from 'react';
import { PackageCheck, Laptop, Archive, AlertTriangle } from 'lucide-react';

const Dashboard = ({ items }) => {
  const readyItems = items.filter(u => u.qty > 0);
  const totalReady = readyItems.reduce((acc, curr) => acc + curr.qty, 0);
  const totalModels = new Set(readyItems.map(u => u.partNumber || u.name)).size;

  const dellItems = readyItems.filter(u => u.brand === "DELL");
  const dellReady = dellItems.reduce((acc, curr) => acc + curr.qty, 0);

  const hpItems = readyItems.filter(u => u.brand === "HP");
  const hpReady = hpItems.reduce((acc, curr) => acc + curr.qty, 0);

  const otherItems = readyItems.filter(u => u.brand === "DELL LAINNYA");
  const otherReady = otherItems.reduce((acc, curr) => acc + curr.qty, 0);

  const criticalItems = items.filter(u => u.qty > 0 && u.qty <= 2).length;

  return (
    <section className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon icon-ready">
          <PackageCheck size={19} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Total Unit Tersedia</span>
          <div className="metric-value">{totalReady} Unit</div>
          <span className="metric-subtext">{totalModels} Model / Tipe Aktif</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon icon-dell">
          <Laptop size={19} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Brand DELL</span>
          <div className="metric-value color-dell">{dellReady} Unit</div>
          <span className="metric-subtext">Latitude & Optiplex</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon icon-hp">
          <Laptop size={19} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok Brand HP</span>
          <div className="metric-value color-hp">{hpReady} Unit</div>
          <span className="metric-subtext">EliteBook, 240 G8/G9, PC</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon icon-other">
          <Archive size={19} />
        </div>
        <div className="metric-data">
          <span className="metric-label">Stok DELL Lainnya</span>
          <div className="metric-value color-other">{otherReady} Unit</div>
          <span className="metric-subtext">Stok Baru Keluaran Lama</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon icon-kritis">
          <AlertTriangle size={19} />
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
