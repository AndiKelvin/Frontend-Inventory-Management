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

  const notes = item.notes || '';
  if (!notes || /take\s*out/i.test(notes)) return 0;

  // Cari pola MAPPING: Nama (X) atau HOLD: Nama (X)
  const mappingMatch = notes.match(/(?:mapping|booking|hold)[^:]*:\s*([^|\n]+)/i);
  if (mappingMatch) {
    const mappingContent = mappingMatch[1];
    if (/take\s*out/i.test(mappingContent)) return 0;
    // Cari angka dalam kurung
    const numMatch = mappingContent.match(/\((\d+)\)/);
    if (numMatch) {
      const booked = parseInt(numMatch[1], 10) || 0;
      return Math.min(item.qty, booked);
    }
  }
  return 0;
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
