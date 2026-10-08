/**
 * Memisahkan dan mengurai catatan barang menjadi data Mapping Sales dan Keterangan Umum
 * @param {string} notesStr
 * @returns {{ mappings: Array<{ id: string, sales: string, qty: number, note: string }>, keterangan: string }}
 */
export const parseNotesAndMapping = (notesStr = '') => {
  if (!notesStr || typeof notesStr !== 'string') {
    return { mappings: [], keterangan: '' };
  }

  let raw = notesStr.trim();

  // Bersihkan log take out lama jika ada
  raw = raw.replace(/(?:mapping|booking|hold)\s*:\s*take\s*out[^\n|]*/gi, '').replace(/^\|\s*|\s*\|\s*$/g, '').trim();

  const mappingRegex = /(?:mapping|booking|hold)\s*:\s*([^|\n]+)/i;
  const match = raw.match(mappingRegex);

  const mappings = [];
  let keterangan = raw;

  if (match) {
    const fullMatch = match[0];
    const mappingContent = match[1].trim();

    // Hapus blok mapping dari teks keterangan
    keterangan = raw.replace(fullMatch, '').replace(/^\|\s*|\s*\|\s*$/g, '').trim();

    // Urai jika bukan sekadar log take out
    if (!/take\s*out/i.test(mappingContent)) {
      // Pisahkan jika ada beberapa sales (contoh: "Kak Grace (2), Kak Pipit (1)")
      const parts = mappingContent.split(/,\s*(?=[^()]*(?:\(|$))/);
      parts.forEach((part, index) => {
        const itemStr = part.trim();
        if (!itemStr) return;

        // Cari pola: Nama Sales [opsional keterangan/project] (Qty)
        const itemMatch = itemStr.match(/^([^(]+?)(?:\s*-\s*([^(]+))?\s*\((\d+)\)/);
        if (itemMatch) {
          const salesName = itemMatch[1].trim();
          const extraNote = (itemMatch[2] || '').trim();
          const qty = parseInt(itemMatch[3], 10) || 0;
          if (salesName && qty > 0) {
            mappings.push({
              id: `map-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
              sales: salesName,
              qty,
              note: extraNote
            });
          }
        } else {
          // Fallback bila tidak ada angka kurung tapi ada teks nama sales
          const numOnlyMatch = itemStr.match(/\((\d+)\)/);
          const qty = numOnlyMatch ? parseInt(numOnlyMatch[1], 10) || 1 : 1;
          const salesName = itemStr.replace(/\(\d+\)/, '').trim();
          if (salesName) {
            mappings.push({
              id: `map-${Date.now()}-${index}`,
              sales: salesName,
              qty,
              note: ''
            });
          }
        }
      });
    }
  }

  return { mappings, keterangan };
};

/**
 * Menyusun kembali string notes yang rapi dan konsisten dari daftar mapping dan keterangan umum
 * @param {Array<{ sales: string, qty: number, note?: string }>} mappings
 * @param {string} keterangan
 * @returns {string}
 */
export const formatNotesAndMapping = (mappings = [], keterangan = '') => {
  const validMappings = (mappings || []).filter(m => m && m.sales && m.sales.trim() && parseInt(m.qty, 10) > 0);
  const cleanKeterangan = (keterangan || '')
    .replace(/(?:mapping|booking|hold)\s*:\s*take\s*out[^\n|]*/gi, '')
    .replace(/^\|\s*|\s*\|\s*$/g, '')
    .trim();

  let mappingStr = '';
  if (validMappings.length > 0) {
    const formattedList = validMappings.map(m => {
      const sales = m.sales.trim();
      const qty = parseInt(m.qty, 10);
      const note = (m.note || '').trim();
      return note ? `${sales} - ${note} (${qty})` : `${sales} (${qty})`;
    });
    mappingStr = `MAPPING: ${formattedList.join(', ')}`;
  }

  if (mappingStr && cleanKeterangan) {
    return `${mappingStr} | ${cleanKeterangan}`;
  }
  if (mappingStr) {
    return mappingStr;
  }
  return cleanKeterangan;
};

/**
 * Menghitung jumlah stok yang sedang di-booking / mapping untuk suatu unit
 * @param {Object} item
 * @returns {number}
 */
export const getBookedQty = (item) => {
  if (!item || !item.qty || item.qty <= 0) return 0;
  if (typeof item.bookedQty === 'number') {
    return Math.min(item.qty, Math.max(0, item.bookedQty));
  }

  const { mappings } = parseNotesAndMapping(item.notes || '');
  if (!mappings || mappings.length === 0) return 0;

  const totalBooked = mappings.reduce((sum, m) => sum + (parseInt(m.qty, 10) || 0), 0);
  return Math.min(item.qty, totalBooked);
};

/**
 * Menghitung stok bebas jual (Stok Fisik - Stok Booking)
 * @param {Object} item
 * @returns {number}
 */
export const getAvailableQty = (item) => {
  if (!item || !item.qty) return 0;
  const booked = getBookedQty(item);
  return Math.max(0, item.qty - booked);
};

/**
 * Menyusun teks rapi informasi stok barang siap salin untuk WhatsApp atau chat
 * @param {Object} item
 * @returns {string}
 */
export const generateStockShareText = (item) => {
  if (!item) return '';
  const booked = getBookedQty(item);
  const available = getAvailableQty(item);
  const { mappings, keterangan } = parseNotesAndMapping(item.notes || '');

  const brand = (item.brand || '').trim();
  const name = (item.name || '').trim();
  const partNumber = (item.partNumber || '').trim();

  const lines = [
    `*${brand ? `${brand} ` : ''}${name}*`,
    `Part Number: ${partNumber || '-'}`
  ];

  const specs = [];
  if (item.cpu) specs.push(`CPU: ${item.cpu}`);
  if (item.ram) specs.push(`RAM: ${item.ram}`);
  if (item.storage) specs.push(`Storage: ${item.storage}`);
  if (specs.length > 0) {
    lines.push(`Spesifikasi: ${specs.join(' | ')}`);
  }

  const qty = parseInt(item.qty, 10) || 0;
  if (qty === 0) {
    lines.push(`Status Stok: *HABIS (0 Unit)*`);
  } else {
    lines.push(`Total Stok Fisik: *${qty} Unit*`);
    if (booked > 0) {
      lines.push(`- Ready Bebas Jual: *${available} Unit*`);
      const mapDetails = mappings.map(m => `${m.sales}${m.note ? ` (${m.note})` : ''}: ${m.qty}`).join(', ');
      lines.push(`- Di-Booking (Mapping): ${booked} Unit${mapDetails ? ` [${mapDetails}]` : ''}`);
    } else {
      lines.push(`- Status: *Ready Bebas Jual (${qty} Unit)*`);
    }
  }

  if (item.location) {
    lines.push(`Lokasi: ${item.location}`);
  }

  if (keterangan) {
    lines.push(`Catatan: ${keterangan}`);
  }

  return lines.join('\n');
};


