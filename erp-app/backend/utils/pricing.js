const calculateLineAmount = (qty, price, disc=0, gst=0) => {
  const base = qty * price;
  const da = (base * disc) / 100;
  const tax = base - da;
  const ga = (tax * gst) / 100;
  return {
    baseAmount: +base.toFixed(2),
    discountAmount: +da.toFixed(2),
    taxableAmount: +tax.toFixed(2),
    gstAmount: +ga.toFixed(2),
    lineAmount: +(tax + ga).toFixed(2)
  };
};

const calculateGrandTotal = (items) => +items.reduce((s, i) => {
  const { lineAmount } = calculateLineAmount(i.quantity, i.unit_price, i.discount_pct, i.gst_pct);
  return s + lineAmount;
}, 0).toFixed(2);

module.exports = { calculateLineAmount, calculateGrandTotal };
