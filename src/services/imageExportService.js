/**
 * imageExportService.js
 * Generator gambar JPG resolusi tinggi (2x Retina scale) untuk:
 * 1. Export SMB HP (.jpg)
 * 2. Export SMB Dell (.jpg)
 * 3. Export Distri HP (.jpg)
 * 4. Export Distri Dell (.jpg)
 *
 * Menggunakan HTML5 Canvas 2D murni tanpa dependensi eksternal tambahan.
 * Latar belakang putih bersih, border garis tipis, tanpa warna background ("tanpa warna").
 */

function getMonthYearTitle() {
  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getPeriodTitle() {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  return `Periode Tgl. ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Helper untuk memecah teks berdasarkan lebar maksimum & newline (\n)
 */
function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const lines = [];
  const rawParagraphs = String(text).split('\n');

  for (const para of rawParagraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Trigger download file JPG dari canvas
 */
function downloadCanvasAsJpg(canvas, filename) {
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    'image/jpeg',
    0.95
  );
}

/**
 * Menggambar Logo HP (Vector Canvas)
 */
function drawHpLogo(ctx, cx, cy, radius) {
  ctx.save();
  // Lingkaran luar HP
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Teks "hp" italic putih
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic bold ${Math.round(radius * 1.05)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('hp', cx - 1, cy);
  ctx.restore();
}

/**
 * Menggambar Logo Dell (Vector Canvas)
 */
function drawDellLogo(ctx, cx, cy, radius) {
  ctx.save();
  // Lingkaran luar Dell
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0076CE';
  ctx.fill();

  // Lingkaran putih tengah
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Teks "DELL"
  ctx.fillStyle = '#0076CE';
  ctx.font = `bold ${Math.round(radius * 0.65)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DELL', cx, cy + 1);
  ctx.restore();
}

/**
 * -------------------------------------------------------------
 * 1. EXPORT DISTRI HP (Format Capture 1 - Tanpa Warna)
 * -------------------------------------------------------------
 */
export function exportDistriHpJpg() {
  const period = getPeriodTitle();
  const scale = 2; // High-DPI 2x Retina scale

  // Kolom: TYPE, PART NUMBER, Nama Barang, Barang datang Dari, TOTAL STOCK (IGUN), Total REAL, BREAKDOWN TOTAL REAL
  const columns = [
    { title: 'TYPE', width: 95, align: 'center' },
    { title: 'PART\nNUMBER', width: 105, align: 'center' },
    { title: 'Nama Barang', width: 350, align: 'left' },
    { title: 'Barang datang Dari', width: 240, align: 'left' },
    { title: 'TOTAL\nSTOCK\n(IGUN)', width: 80, align: 'center' },
    { title: 'Total\nREAL', width: 70, align: 'center' },
    { title: 'BREAKDOWN TOTAL REAL', width: 330, align: 'left' }
  ];

  const totalTableWidth = columns.reduce((acc, c) => acc + c.width, 0); // 1270px
  const margin = 30;
  const canvasWidth = totalTableWidth + margin * 2;

  // Data rows terstruktur: 2 kategori TYPE (PC dan NOTEBOOK)
  const rows = [
    // 1. Kategori PC
    {
      group: 'PC',
      partNumber: '8M0Y9PA',
      name: 'HP MAVERICK 280 G9 i7-12700 - 16GB - 512GB - WIN11P',
      subrows: [
        {
          distributor: 'PT. ADAKOM INTERNATIONAL TECHNOLOGY',
          igun: '',
          real: 16,
          breakdown: 'STOCK JKT :\n- PALLAZO (16)\n*TOTAL JKT = (16)'
        }
      ]
    },
    // 2. Kategori NOTEBOOK
    {
      group: 'NOTEBOOK',
      partNumber: '526H3PA',
      name: 'HP 240-G8-i3-1115G4-4GB-256GB-14Inch-W10H',
      subrows: [
        {
          distributor: 'PT SYNEX METRODATA INDONESIA',
          igun: 0,
          real: 1,
          breakdown: 'STOCK JKT :\n- PALLAZO (1) - Unit selesai service, replace motherboard\n*TOTAL JKT = (1)'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '365K6PA',
      name: 'HP 240-G8-I5-1035G1-8GB-256GB-Intel® UHD Graphics-14Inch-W10H',
      subrows: [
        {
          distributor: 'PT TECH DATA ADVANCED SOLUTIONS',
          igun: 0,
          real: 1,
          breakdown: 'STOCK DEMO :\n- IT TALK AMBAS (1) - Barang Display Toko\n*TOTAL DEMO = (1)'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '61G52PA',
      name: 'HP 240-G8-i5-1135G7-8GB-512GB-Intel® UHD Graphics-14Inch-W11H',
      subrows: [
        {
          distributor: 'PT ECS INDO JAYA',
          igun: 0,
          real: 0,
          breakdown: 'ALOKASI PAK IGUN STOCK JKT :\n- PALLAZO (2)\n*TOTAL ALOKASI IGUN JKT (2)'
        },
        {
          distributor: 'PT TECH DATA ADVANCED SOLUTIONS',
          igun: 5,
          real: 0,
          breakdown: 'SERVICE :\n- Mati Total (2)\n- FAN EROR (1)\n*TOTAL SERVICE = (3)\n\nMAPPING :\n- Kak Pipit - BTL (1)\n*TOTAL Mapping = (1)'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '36F56PA',
      name: 'HP 240-G8-i7-1065G7-8GB-512GB-Radeon 620 Graphics-14Inch-W10H',
      subrows: [
        {
          distributor: 'PT TECH DATA ADVANCED SOLUTIONS',
          igun: 0,
          real: 3,
          breakdown: 'STOCK IT TALK :\n- IT TALK SBY (1)\n- IT TALK AMBAS (1)\n*TOTAL IT TALK = (2)\n\nSERVICES : (1) - unit tidak bisa dilakukan service'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '61G56PA',
      name: 'HP 240-G8-i7-1165G7-16GB-128GB-1TB-14Inch-W11P',
      subrows: [
        {
          distributor: 'PT TECH DATA ADVANCED SOLUTIONS',
          igun: 0,
          real: 1,
          breakdown: 'STOCK IT TALK :\n- IT TALK AMBAS (1) - Barang Display Toko\n*TOTAL IT TALK = (1)'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '365K5PA',
      name: 'HP 240-G8-i7-1065G7-8GB-1TB-Radeon RX 620 2GB-14Inch-W10P',
      subrows: [
        {
          distributor: 'PT SYNEX METRODATA INDONESIA',
          igun: 0,
          real: 62,
          breakdown: 'STOCK JKT :\n- PALLAZO (43)\n*TOTAL JKT (43) - 7 OK, 3 repacking dus\n\nSTOCK :\n- HP CEK UNIT (2)-barang tdk kembali karena diklaim DOA ke HP\n*TOTAL = (2)\n\nSERVICE MILIK CUSTOMER :\n- Unit demo IT Talk Semarang, investaris KEI (layar blok) : (1)\n- Returan MMS & DTS (battery drop) : (4), Memori penuh : (8)\n- No Charger Baterai 0% (2) - Lain2 (2)\n*TOTAL SERVICE = 17'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '446J7PA',
      name: 'HP EliteBook 830-G8-i7-1165G7-8GB-512GB-Intel Iris Xᵉ Graphics-13.3Inch-W10P',
      subrows: [
        {
          distributor: 'PT TECH DATA ADVANCED SOLUTIONS',
          igun: 0,
          real: 42,
          breakdown: 'STOCK JKT :\n- PALLAZO (42) : DUS BAGUS\n*TOTAL JKT (42)\n\nMAPPING :\n- BTL (10)\n*TOTAL Mapping = (10)'
        }
      ]
    },
    {
      group: 'NOTEBOOK',
      partNumber: '9J086PT',
      name: 'HP Elitebook 630 G10 i7-1355U-16GB-1TB SSD-13.3 Inch-W11P-1Y',
      subrows: [
        {
          distributor: 'PT ADAKOM INTERNASIONAL TECHNOLOGY',
          igun: '',
          real: 15,
          breakdown: 'STOCK JKT :\n- Pallazo (15)\n*TOTAL STOCK = (15)'
        }
      ]
    }
  ];

  // Ukur tinggi canvas dinamis dengan pengukuran subrow proporsional
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '12px "Segoe UI", Arial, sans-serif';

  const rowLayouts = rows.map((item) => {
    // Ukur tinggi setiap subrow berdasarkan teks spesifiknya
    const subHeights = item.subrows.map((sub) => {
      const distLines = wrapText(tempCtx, sub.distributor, columns[3].width - 16);
      const bdLines = wrapText(tempCtx, sub.breakdown, columns[6].width - 16);
      const distH = distLines.length * 16 + 20;
      const bdH = bdLines.length * 15 + 24;
      return Math.max(distH, bdH, 50);
    });

    const totalSubHeight = subHeights.reduce((a, b) => a + b, 0);
    const nameLines = wrapText(tempCtx, item.name, columns[2].width - 16);
    const nameH = nameLines.length * 16 + 24;
    const rHeight = Math.max(totalSubHeight, nameH, 50);

    // Jika nameH lebih tinggi dari total subrow, distribusikan sisa tingginya
    if (rHeight > totalSubHeight && item.subrows.length > 0) {
      const diff = rHeight - totalSubHeight;
      const extra = diff / item.subrows.length;
      for (let i = 0; i < subHeights.length; i++) {
        subHeights[i] += extra;
      }
    }

    return {
      rHeight,
      subHeights
    };
  });

  const rowHeights = rowLayouts.map((l) => l.rHeight);
  const headerHeight = 110;
  const colHeaderHeight = 44;
  const totalRowHeight = 32;
  const tableDataHeight = rowHeights.reduce((acc, h) => acc + h, 0);
  const canvasHeight = margin + headerHeight + colHeaderHeight + tableDataHeight + totalRowHeight + margin;

  // Siapkan canvas sebenarnya
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background putih murni
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Header Logo & Judul
  drawHpLogo(ctx, canvasWidth / 2, margin + 22, 18);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Laporan Stock Barang PT. Projectindo Teknowindata', canvasWidth / 2, margin + 58);

  ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(period, canvasWidth / 2, margin + 80);

  // Gambar Header Tabel (Border tipis, background putih)
  let curY = margin + headerHeight;
  let curX = margin;

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';

  columns.forEach((col) => {
    ctx.strokeRect(curX, curY, col.width, colHeaderHeight);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const headerLines = col.title.split('\n');
    const lineHeight = 14;
    const startTextY = curY + colHeaderHeight / 2 - ((headerLines.length - 1) * lineHeight) / 2;

    headerLines.forEach((line, idx) => {
      ctx.fillText(line, curX + col.width / 2, startTextY + idx * lineHeight);
    });

    curX += col.width;
  });

  curY += colHeaderHeight;

  // Hitung tinggi grouping "PC" dan "NOTEBOOK"
  const pcRows = rows.filter((r) => r.group === 'PC');
  const _notebookRows = rows.filter((r) => r.group === 'NOTEBOOK');
  const pcTotalHeight = rowHeights.slice(0, pcRows.length).reduce((a, b) => a + b, 0);
  const notebookTotalHeight = rowHeights.slice(pcRows.length).reduce((a, b) => a + b, 0);

  // Gambar cell merged TYPE: PC
  ctx.strokeRect(margin, curY, columns[0].width, pcTotalHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PC', margin + columns[0].width / 2, curY + pcTotalHeight / 2);

  // Gambar cell merged TYPE: NOTEBOOK
  ctx.strokeRect(margin, curY + pcTotalHeight, columns[0].width, notebookTotalHeight);
  ctx.fillText('NOTEBOOK', margin + columns[0].width / 2, curY + pcTotalHeight + notebookTotalHeight / 2);

  // Gambar Data Baris (Mulai dari Kolom 1 karena Kolom 0 TYPE sudah di-merge per grup)
  rows.forEach((item, rIdx) => {
    const layout = rowLayouts[rIdx];
    const rHeight = layout.rHeight;
    curX = margin + columns[0].width;

    // Col 1: PART NUMBER
    ctx.strokeRect(curX, curY, columns[1].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.partNumber, curX + columns[1].width / 2, curY + rHeight / 2);
    curX += columns[1].width;

    // Col 2: Nama Barang
    ctx.strokeRect(curX, curY, columns[2].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = '500 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const nameLines = wrapText(ctx, item.name, columns[2].width - 16);
    const nameStartY = curY + (rHeight - nameLines.length * 16) / 2;
    nameLines.forEach((line, lIdx) => {
      ctx.fillText(line, curX + 8, nameStartY + lIdx * 16);
    });
    curX += columns[2].width;

    // Subrows untuk Col 3, 4, 5, 6 (Dihitung dengan subHeights masing-masing)
    let currentSubY = curY;

    item.subrows.forEach((sub, sIdx) => {
      const subHeight = layout.subHeights[sIdx];
      let subX = curX;

      // Col 3: Barang datang Dari
      ctx.strokeRect(subX, currentSubY, columns[3].width, subHeight);
      ctx.fillStyle = '#000000';
      ctx.font = '500 11.5px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const distLines = wrapText(ctx, sub.distributor, columns[3].width - 16);
      const distStartY = currentSubY + (subHeight - distLines.length * 15) / 2;
      distLines.forEach((l, idx) => {
        ctx.fillText(l, subX + 8, distStartY + idx * 15);
      });
      subX += columns[3].width;

      // Col 4: TOTAL STOCK (IGUN)
      ctx.strokeRect(subX, currentSubY, columns[4].width, subHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sub.igun !== '' ? String(sub.igun) : '', subX + columns[4].width / 2, currentSubY + subHeight / 2);
      subX += columns[4].width;

      // Col 5: Total REAL
      ctx.strokeRect(subX, currentSubY, columns[5].width, subHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(sub.real), subX + columns[5].width / 2, currentSubY + subHeight / 2);
      subX += columns[5].width;

      // Col 6: BREAKDOWN TOTAL REAL (Rapi, berjarak, teks judul tebal)
      ctx.strokeRect(subX, currentSubY, columns[6].width, subHeight);
      ctx.fillStyle = '#000000';
      ctx.font = '500 11px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const bdLines = wrapText(ctx, sub.breakdown, columns[6].width - 16);
      const bdStartY = currentSubY + Math.max(8, (subHeight - bdLines.length * 14) / 2);
      bdLines.forEach((l, idx) => {
        if (l.startsWith('*TOTAL') || l.includes('TOTAL STOCK')) {
          ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        } else if (l.endsWith(':')) {
          ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        } else {
          ctx.font = '500 11px "Segoe UI", Arial, sans-serif';
        }
        ctx.fillText(l, subX + 8, bdStartY + idx * 14);
      });

      currentSubY += subHeight;
    });

    curY += rHeight;
  });

  // Baris Total (Cols 0-3 Merged, Col 4 IGUN = 5, Col 5 Total Real = 141)
  curX = margin;
  const mergedColWidth = columns[0].width + columns[1].width + columns[2].width + columns[3].width;
  ctx.strokeRect(curX, curY, mergedColWidth, totalRowHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOTAL', curX + mergedColWidth / 2, curY + totalRowHeight / 2);
  curX += mergedColWidth;

  // Total IGUN
  ctx.strokeRect(curX, curY, columns[4].width, totalRowHeight);
  ctx.fillText('5', curX + columns[4].width / 2, curY + totalRowHeight / 2);
  curX += columns[4].width;

  // Total Real
  ctx.strokeRect(curX, curY, columns[5].width, totalRowHeight);
  ctx.fillText('141', curX + columns[5].width / 2, curY + totalRowHeight / 2);
  curX += columns[5].width;

  // Kosong kolom terakhir
  ctx.strokeRect(curX, curY, columns[6].width, totalRowHeight);

  const cleanFilename = `LAPORAN_DISTRI_HP_${new Date().toISOString().slice(0, 10)}.jpg`;
  downloadCanvasAsJpg(canvas, cleanFilename);
}

/**
 * -------------------------------------------------------------
 * 2. EXPORT DISTRI DELL (Format Capture 2 - Tanpa Warna)
 * -------------------------------------------------------------
 */
export function exportDistriDellJpg() {
  const period = getPeriodTitle();
  const scale = 2; // High-DPI 2x

  // Kolom: TYPE, Part ID GSK, Nama Barang, Barang Datang Dari, Total Real, Breakdown Total Real
  const columns = [
    { title: 'TYPE', width: 95, align: 'center' },
    { title: 'Part ID GSK', width: 105, align: 'center' },
    { title: 'Nama Barang', width: 360, align: 'left' },
    { title: 'Barang Datang Dari', width: 250, align: 'left' },
    { title: 'Total Real', width: 80, align: 'center' },
    { title: 'Breakdown Total Real', width: 380, align: 'left' }
  ];

  const totalTableWidth = columns.reduce((acc, c) => acc + c.width, 0); // 1270px
  const margin = 30;
  const canvasWidth = totalTableWidth + margin * 2;

  const rows = [
    // Group LATITUDE
    {
      group: 'LATITUDE',
      partNumber: 'GA3440I5V2',
      name: 'Latitude 3440-i51235U-16GB-512GB-W11P-U-3Y-FINGERPRINT',
      real: 1,
      distributors: [
        'PT. ADAKOM INTERNATIONAL TECHNOLOGY',
        'PT. TECH DATA ADVANCED SOLUTIONS INDONESIA'
      ],
      breakdown: 'STOCK JKT :\n- Pallazo (1)\n*TOTAL JKT = (1)\n\nMAPPING :\n- Mba Irwin (1)\n*TOTAL MAPPING = (1)'
    },
    {
      group: 'LATITUDE',
      partNumber: 'GA7330I5V1',
      name: 'Latitude 7330 2in1 FHD i5 1245U 16GB 512SSD IRIS 11 PRO 3YR',
      real: 8,
      distributors: ['PT. ADAKOM INTERNATIONAL TECHNOLOGY'],
      breakdown: 'STOCK JKT :\n Pallazo (6)\n*TOTAL JKT = (6)\n\nSTOCK DEMO IT TALK :\n- IT TALK SMG (1)\n- IT TAK SBY (1)\n*TOTAL DEMO IT TALK = (2)\n\nMAPPING :\n- Kak Pipit - RSU (5)\n*TOTAL MAPPING = (5)'
    },
    {
      group: 'LATITUDE',
      partNumber: 'GA3440I7V1',
      name: 'Latitude 3440-i71355U-16GB-512GB-W11P-U-3Y-FINGERPRINT',
      real: 24,
      distributors: [
        'PT. ADAKOM INTERNATIONAL TECHNOLOGY',
        'PT. TECH DATA ADVANCED SOLUTIONS INDONESIA'
      ],
      breakdown: 'STOCK JKT :\n- Pallazo (21)\n*TOTAL JKT = (21)\n\nDEMO :\n- Pegadaian (1)\n*TOTAL DEMO = (1)\n\nSTOCK DEMO IT TALK :\n- IT TALK JKT (1)\n- IT TALK SEMARANG (1)\n*TOTAL DEMO IT TALK = (2)\n\nMAPPING :\n- Kak puput - DIY (1)\n*TOTAL MAPPING = (1)'
    },
    {
      group: 'LATITUDE',
      partNumber: 'GA3440I7V2',
      name: 'Latitude 3440 i7 1355U - 8GB - 512GB SSD - W11 PRO - 3YR',
      real: 5,
      distributors: ['PT. TECH DATA ADVANCED SOLUTIONS INDONESIA'],
      breakdown: 'STOCK JKT :\n- Pallazo (5)\n*TOTAL JKT = (5)\n\nMAPPING :\n- Kak pipit - Daesang (1)\n- Mba Irwin - Fuluso (1)\n*TOTAL MAPPING = (2)'
    },
    {
      group: 'LATITUDE',
      partNumber: 'GA7450U7V1',
      name: 'Latitude 7450 Ultra 7-155U-16GB-512GB-W11P-3Y No Touch',
      real: 1,
      distributors: ['PT. ADAKOM INTERNATIONAL TECHNOLOGY'],
      breakdown: 'STOCK JKT :\n- Pallazo (1)\n*TOTAL JKT = (1)\n\nMAPPING :\n- Mas Funghery (1)\n*TOTAL MAPPING = (1)'
    },
    // Group OPTIPLEX
    {
      group: 'OPTIPLEX',
      partNumber: 'GB7010SFF5',
      name: 'Optiplex 7010 SFF -i3-13100-8GB-512GB-W11H-U-3Y',
      real: 13,
      distributors: ['PT. ADAKOM INTERNATIONAL TECHNOLOGY'],
      breakdown: 'STOCK JKT :\n- Pallazo (8)\n*TOTAL JKT = (8)\n\nSTOCK DEMO IT TALK :\n- IT TALK JKT (2)\n- IT TALK SMG (1)\n- IT TALK SBY (1)\n*TOTAL DEMO IT TALK = (4)\n\nSERVICE :\n- UNIT DI CEK (1)\n*TOTAL SERVICE = (1)'
    },
    {
      group: 'OPTIPLEX',
      partNumber: 'GB7010I7V3',
      name: 'Optiplex 7010 Tower Plus i7 13700-16GB-512GB-W11P-3Y',
      real: 39,
      distributors: ['PT. ADAKOM INTERNATIONAL TECHNOLOGY'],
      breakdown: 'STOCK JKT :\n- Pallazo (39)\n*TOTAL JKT = (39)\n\nMAPPING :\n- Kak Pipit - VTS (1)\n*TOTAL MAPPING = (1)'
    },
    {
      group: 'OPTIPLEX',
      partNumber: 'GB3000SFF',
      name: 'DELL OPTIPLEX 3000 SFF I3-12100-4GB-1TB',
      real: 15,
      distributors: ['PT. ADAKOM INTERNATIONAL TECHNOLOGY'],
      breakdown: 'STOCK JKT :\n- Pallazo (15)\n*TOTAL JKT = (15)'
    }
  ];

  // Ukur tinggi baris
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '12px "Segoe UI", Arial, sans-serif';

  const rowHeights = rows.map((item) => {
    const distLinesCount = item.distributors.reduce(
      (acc, d) => acc + wrapText(tempCtx, d, columns[3].width - 16).length,
      0
    );
    const bdLines = wrapText(tempCtx, item.breakdown, columns[5].width - 16);
    const nameLines = wrapText(tempCtx, item.name, columns[2].width - 16);

    const distHeight = distLinesCount * 18 + 16;
    const bdHeight = bdLines.length * 15 + 16;
    const nameHeight = nameLines.length * 16 + 18;

    return Math.max(distHeight, bdHeight, nameHeight, 52);
  });

  const headerHeight = 110;
  const colHeaderHeight = 44;
  const totalRowHeight = 32;
  const tableDataHeight = rowHeights.reduce((acc, h) => acc + h, 0);
  const canvasHeight = margin + headerHeight + colHeaderHeight + tableDataHeight + totalRowHeight + margin;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background putih murni
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Header Logo & Judul
  drawDellLogo(ctx, canvasWidth / 2, margin + 22, 18);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Laporan Stock Barang DELL PT. Global Solusindo Kompudata', canvasWidth / 2, margin + 58);

  ctx.font = '600 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(period, canvasWidth / 2, margin + 80);

  // Header Kolom
  let curY = margin + headerHeight;
  let curX = margin;

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';

  columns.forEach((col) => {
    ctx.strokeRect(curX, curY, col.width, colHeaderHeight);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(col.title, curX + col.width / 2, curY + colHeaderHeight / 2);
    curX += col.width;
  });

  curY += colHeaderHeight;

  // Hitung total tinggi untuk grouping "LATITUDE" dan "OPTIPLEX"
  const latitudeRows = rows.filter((r) => r.group === 'LATITUDE');
  const _optiplexRows = rows.filter((r) => r.group === 'OPTIPLEX');
  const latitudeTotalHeight = rowHeights.slice(0, latitudeRows.length).reduce((a, b) => a + b, 0);
  const optiplexTotalHeight = rowHeights.slice(latitudeRows.length).reduce((a, b) => a + b, 0);

  // Gambar cell merged TYPE: LATITUDE
  ctx.strokeRect(margin, curY, columns[0].width, latitudeTotalHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LATITUDE', margin + columns[0].width / 2, curY + latitudeTotalHeight / 2);

  // Gambar cell merged TYPE: OPTIPLEX
  ctx.strokeRect(margin, curY + latitudeTotalHeight, columns[0].width, optiplexTotalHeight);
  ctx.fillText('OPTIPLEX', margin + columns[0].width / 2, curY + latitudeTotalHeight + optiplexTotalHeight / 2);

  let totalRealSum = 0;

  // Gambar Data Baris
  rows.forEach((item, rIdx) => {
    const rHeight = rowHeights[rIdx];
    curX = margin + columns[0].width; // skip col 0 karena sudah di-merge per group

    // Col 1: Part ID GSK
    ctx.strokeRect(curX, curY, columns[1].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.partNumber, curX + columns[1].width / 2, curY + rHeight / 2);
    curX += columns[1].width;

    // Col 2: Nama Barang
    ctx.strokeRect(curX, curY, columns[2].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = '500 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const nameLines = wrapText(ctx, item.name, columns[2].width - 16);
    const nameStartY = curY + (rHeight - nameLines.length * 16) / 2;
    nameLines.forEach((l, idx) => {
      ctx.fillText(l, curX + 8, nameStartY + idx * 16);
    });
    curX += columns[2].width;

    // Col 3: Barang Datang Dari (Bisa multi distributor split per cell)
    const numDist = item.distributors.length;
    const distSubHeight = rHeight / numDist;
    item.distributors.forEach((dist, dIdx) => {
      const dY = curY + dIdx * distSubHeight;
      ctx.strokeRect(curX, dY, columns[3].width, distSubHeight);
      ctx.fillStyle = '#000000';
      ctx.font = '500 11.5px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const distLines = wrapText(ctx, dist, columns[3].width - 16);
      const distStartY = dY + (distSubHeight - distLines.length * 15) / 2;
      distLines.forEach((l, idx) => {
        ctx.fillText(l, curX + 8, distStartY + idx * 15);
      });
    });
    curX += columns[3].width;

    // Col 4: Total Real
    ctx.strokeRect(curX, curY, columns[4].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(item.real), curX + columns[4].width / 2, curY + rHeight / 2);
    totalRealSum += item.real;
    curX += columns[4].width;

    // Col 5: Breakdown Total Real
    ctx.strokeRect(curX, curY, columns[5].width, rHeight);
    ctx.fillStyle = '#000000';
    ctx.font = '500 11px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const bdLines = wrapText(ctx, item.breakdown, columns[5].width - 16);
    const bdStartY = curY + Math.max(6, (rHeight - bdLines.length * 14) / 2);
    bdLines.forEach((l, idx) => {
      if (l.startsWith('*TOTAL') || l.includes('TOTAL MAPPING') || l.includes('TOTAL DEMO')) {
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      } else if (l.endsWith(':')) {
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      } else {
        ctx.font = '500 11px "Segoe UI", Arial, sans-serif';
      }
      ctx.fillText(l, curX + 8, bdStartY + idx * 14);
    });

    curY += rHeight;
  });

  // Baris Total (Cols 0-3 Merged, Col 4 Total Real = 108)
  curX = margin;
  const mergedColWidth = columns[0].width + columns[1].width + columns[2].width + columns[3].width;
  ctx.strokeRect(curX, curY, mergedColWidth, totalRowHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOTAL', curX + mergedColWidth / 2, curY + totalRowHeight / 2);
  curX += mergedColWidth;

  // Total Real Value
  ctx.strokeRect(curX, curY, columns[4].width, totalRowHeight);
  ctx.fillText(String(totalRealSum), curX + columns[4].width / 2, curY + totalRowHeight / 2);
  curX += columns[4].width;

  // Kosong kolom terakhir
  ctx.strokeRect(curX, curY, columns[5].width, totalRowHeight);

  const cleanFilename = `LAPORAN_DISTRI_DELL_${new Date().toISOString().slice(0, 10)}.jpg`;
  downloadCanvasAsJpg(canvas, cleanFilename);
}

/**
 * -------------------------------------------------------------
 * 3. EXPORT SMB HP (Format Tangkapan Layar SMB - Tanpa Warna)
 * -------------------------------------------------------------
 */
export function exportSmbHpJpg(stockItems = []) {
  const period = getMonthYearTitle();
  const scale = 2;

  // Filter HP urutan 2 - 4 (446J7PA, 8M0Y9PA, 9J086PT)
  let itemsToRender = [];
  if (stockItems && stockItems.length > 0) {
    const hpSorted = stockItems
      .filter((it) => it.brand === 'HP' && it.qty > 0)
      .sort((a, b) => b.qty - a.qty);
    itemsToRender = hpSorted.slice(1, 4);
  }

  // Fallback jika array stockItems kosong
  if (itemsToRender.length === 0) {
    itemsToRender = [
      {
        partNumber: '446J7PA',
        name: 'HP EliteBook 830-G8-i7-1165G7-8GB-512GB-Iris Xe-13.3Inch-W10P'
      },
      {
        partNumber: '8M0Y9PA',
        name: 'HP MAVERICK 280 G9 i7-12700 - 16GB - 512GB - WIN11P'
      },
      {
        partNumber: '9J086PT',
        name: 'HP Elitebook 630 G10 i7-1355U-16GB-1TB SSD-13.3Inch-W11P-1Y'
      }
    ];
  }

  const columns = [
    { title: 'Product Base', width: 140, align: 'center' },
    { title: 'Product Base Name', width: 720, align: 'left' }
  ];

  const totalTableWidth = columns.reduce((a, b) => a + b.width, 0); // 860px
  const margin = 30;
  const canvasWidth = totalTableWidth + margin * 2;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '12px "Segoe UI", Arial, sans-serif';

  const rowHeights = itemsToRender.map((it) => {
    const lines = wrapText(tempCtx, it.name, columns[1].width - 20);
    return Math.max(lines.length * 18 + 14, 34);
  });

  const titleRowHeight = 36;
  const periodRowHeight = 30;
  const colHeaderHeight = 34;
  const tableDataHeight = rowHeights.reduce((a, b) => a + b, 0);
  const canvasHeight = margin + titleRowHeight + periodRowHeight + colHeaderHeight + tableDataHeight + margin;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let curY = margin;
  let curX = margin;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';

  // Baris 1: Judul PT (Merged A1:B1)
  ctx.strokeRect(curX, curY, totalTableWidth, titleRowHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UPDATE STOCK HP PT PROJECTINDO TEKNOWINDATA', curX + totalTableWidth / 2, curY + titleRowHeight / 2);
  curY += titleRowHeight;

  // Baris 2: Periode (Merged A2:B2)
  ctx.strokeRect(curX, curY, totalTableWidth, periodRowHeight);
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(period, curX + totalTableWidth / 2, curY + periodRowHeight / 2);
  curY += periodRowHeight;

  // Baris 3: Header Kolom
  columns.forEach((col) => {
    ctx.strokeRect(curX, curY, col.width, colHeaderHeight);
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(col.title, curX + col.width / 2, curY + colHeaderHeight / 2);
    curX += col.width;
  });
  curY += colHeaderHeight;

  // Baris Data
  itemsToRender.forEach((item, idx) => {
    const rH = rowHeights[idx];
    curX = margin;

    // Col 0: Product Base
    ctx.strokeRect(curX, curY, columns[0].width, rH);
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.partNumber, curX + columns[0].width / 2, curY + rH / 2);
    curX += columns[0].width;

    // Col 1: Product Base Name
    ctx.strokeRect(curX, curY, columns[1].width, rH);
    ctx.font = '500 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, item.name, columns[1].width - 20);
    const startY = curY + (rH - lines.length * 18) / 2;
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, curX + 10, startY + lIdx * 18);
    });

    curY += rH;
  });

  const filename = `UPDATE_STOCK_HP_SMB_${period.replace(/\s+/g, '_')}.jpg`;
  downloadCanvasAsJpg(canvas, filename);
}

/**
 * -------------------------------------------------------------
 * 4. EXPORT SMB DELL (Format Tangkapan Layar SMB - Tanpa Warna)
 * -------------------------------------------------------------
 */
export function exportSmbDellJpg(stockItems = []) {
  const period = getMonthYearTitle();
  const scale = 2;

  const dellPreferredOrder = [
    'GB7010SFF5',
    'GB3000SFF',
    'GA7330I5V1',
    'GA3440I7V1',
    'GA3440I7V2',
    'GB7010I7V3',
    'GB3050MFX7',
    'GB3050MFF',
    'GB46R63'
  ];

  let itemsToRender = [];
  if (stockItems && stockItems.length > 0) {
    itemsToRender = stockItems
      .filter(
        (it) =>
          (it.brand === 'DELL' || it.brand === 'DELL LAINNYA') &&
          it.qty > 1 &&
          !it.partNumber.startsWith('OPT-')
      )
      .sort((a, b) => {
        const idxA = dellPreferredOrder.indexOf(a.partNumber);
        const idxB = dellPreferredOrder.indexOf(b.partNumber);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b.qty - a.qty;
      });
  }

  // Fallback item katalog SMB Dell jika kosong
  if (itemsToRender.length === 0) {
    itemsToRender = [
      { partNumber: 'GB7010SFF5', name: 'Optiplex 7010 SFF -i3-13100-8GB-512GB-W11H-U-3Y' },
      { partNumber: 'GB3000SFF', name: 'DELL OPTIPLEX 3000 SFF I3-12100-4GB-1TB' },
      { partNumber: 'GA7330I5V1', name: 'Latitude 7330 2in1 FHD i5 1245U 16GB 512SSD IRIS 11 PRO 3YR' },
      { partNumber: 'GA3440I7V1', name: 'Latitude 3440-i71355U-16GB-512GB-W11P-U-3Y-FINGERPRINT' },
      { partNumber: 'GA3440I7V2', name: 'Latitude 3440 i7 1355U - 8GB - 512GB SSD - W11 PRO - 3YR' },
      { partNumber: 'GB7010I7V3', name: 'Optiplex 7010 Tower Plus i7 13700-16GB-512GB-W11P-3Y' },
      { partNumber: 'GB3050MFX7', name: 'PC DELL OPTIPLEX 3050 MFF I3-6100T-8 GB (4GBX2)-HDD 500GB-WIN10PRO' },
      { partNumber: 'GB3050MFF', name: 'PC DELL OPTIPLEX 3050 MFF I3-6100T-8 GB (4GBX1-WIN10PRO' },
      { partNumber: 'GB46R63', name: 'VOSTRO DESKTOP DT 3471-I5-9400-8GB-1TB-UBT' }
    ];
  }

  const columns = [
    { title: 'Product Base', width: 140, align: 'center' },
    { title: 'Product Base Name', width: 720, align: 'left' }
  ];

  const totalTableWidth = columns.reduce((a, b) => a + b.width, 0);
  const margin = 30;
  const canvasWidth = totalTableWidth + margin * 2;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '12px "Segoe UI", Arial, sans-serif';

  const rowHeights = itemsToRender.map((it) => {
    const lines = wrapText(tempCtx, it.name, columns[1].width - 20);
    return Math.max(lines.length * 18 + 14, 34);
  });

  const titleRowHeight = 36;
  const periodRowHeight = 30;
  const colHeaderHeight = 34;
  const tableDataHeight = rowHeights.reduce((a, b) => a + b, 0);
  const canvasHeight = margin + titleRowHeight + periodRowHeight + colHeaderHeight + tableDataHeight + margin;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let curY = margin;
  let curX = margin;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';

  // Baris 1: Judul PT (Merged A1:B1)
  ctx.strokeRect(curX, curY, totalTableWidth, titleRowHeight);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UPDATE STOCK DELL PT. GLOBAL SOLUSINDO KOMPUDATA', curX + totalTableWidth / 2, curY + titleRowHeight / 2);
  curY += titleRowHeight;

  // Baris 2: Periode (Merged A2:B2)
  ctx.strokeRect(curX, curY, totalTableWidth, periodRowHeight);
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(period, curX + totalTableWidth / 2, curY + periodRowHeight / 2);
  curY += periodRowHeight;

  // Baris 3: Header Kolom
  columns.forEach((col) => {
    ctx.strokeRect(curX, curY, col.width, colHeaderHeight);
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(col.title, curX + col.width / 2, curY + colHeaderHeight / 2);
    curX += col.width;
  });
  curY += colHeaderHeight;

  // Baris Data
  itemsToRender.forEach((item, idx) => {
    const rH = rowHeights[idx];
    curX = margin;

    // Col 0: Product Base
    ctx.strokeRect(curX, curY, columns[0].width, rH);
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.partNumber, curX + columns[0].width / 2, curY + rH / 2);
    curX += columns[0].width;

    // Col 1: Product Base Name
    ctx.strokeRect(curX, curY, columns[1].width, rH);
    ctx.font = '500 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, item.name, columns[1].width - 20);
    const startY = curY + (rH - lines.length * 18) / 2;
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, curX + 10, startY + lIdx * 18);
    });

    curY += rH;
  });

  const filename = `UPDATE_STOCK_DELL_SMB_${period.replace(/\s+/g, '_')}.jpg`;
  downloadCanvasAsJpg(canvas, filename);
}
