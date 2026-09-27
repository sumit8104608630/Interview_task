const { calculateLineAmount, calculateGrandTotal } = require('../utils/pricing');

describe('Pricing Utils', () => {
  test('Line amount without discount/gst', () => {
    const r = calculateLineAmount(10, 100, 0, 0);
    expect(r.lineAmount).toBe(1000);
    expect(r.baseAmount).toBe(1000);
  });
  test('Line amount with discount only', () => {
    const r = calculateLineAmount(10, 100, 10, 0);
    expect(r.discountAmount).toBe(100);
    expect(r.lineAmount).toBe(900);
  });
  test('Line amount with gst only', () => {
    const r = calculateLineAmount(10, 100, 0, 18);
    expect(r.gstAmount).toBe(180);
    expect(r.lineAmount).toBe(1180);
  });
  test('Line amount with both discount and gst (50x450x5%x18%)', () => {
    const r = calculateLineAmount(50, 450, 5, 18);
    const base = 50 * 450;
    const disc = base * 0.05;
    const tax = base - disc;
    const gst = tax * 0.18;
    expect(r.lineAmount).toBe(+(tax + gst).toFixed(2));
    expect(r.baseAmount).toBe(base);
    expect(r.discountAmount).toBe(+disc.toFixed(2));
    expect(r.taxableAmount).toBe(+tax.toFixed(2));
    expect(r.gstAmount).toBe(+gst.toFixed(2));
  });
  test('Grand total sums items', () => {
    const items = [
      { quantity: 2, unit_price: 100, discount_pct: 0, gst_pct: 0 },
      { quantity: 3, unit_price: 200, discount_pct: 0, gst_pct: 0 },
    ];
    expect(calculateGrandTotal(items)).toBe(800);
  });
  test('Grand total with discount + gst precision', () => {
    const items = [{ quantity: 50, unit_price: 450, discount_pct: 5, gst_pct: 18 }];
    expect(calculateGrandTotal(items)).toBe(calculateLineAmount(50, 450, 5, 18).lineAmount);
  });
});
