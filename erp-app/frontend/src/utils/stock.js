export const LOW_STOCK_THRESHOLD = 20;

export const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const computeAvailable = (row, { clampNegative = true } = {}) => {
  const physical = safeNumber(row?.physical_qty);
  const reserved = safeNumber(row?.reserved_qty);
  const damaged  = safeNumber(row?.damaged_qty);
  const server   = safeNumber(row?.available_qty, NaN);
  const raw = Number.isFinite(server) ? server : physical - reserved - damaged;
  return clampNegative ? Math.max(0, raw) : raw;
};

export const stockBadgeClass = (available, lowStockThreshold = LOW_STOCK_THRESHOLD) => {
  const n = safeNumber(available, 0);
  if (n <= 0) return 'bg-red-100 text-red-700';
  if (n <= lowStockThreshold) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

export const stockStatusText = (available, lowStockThreshold = LOW_STOCK_THRESHOLD) => {
  const n = safeNumber(available, 0);
  if (n <= 0) return 'Out of Stock';
  if (n <= lowStockThreshold) return 'Low Stock';
  return 'In Stock';
};
