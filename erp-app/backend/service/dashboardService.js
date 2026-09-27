const customerModel = require('../model/customerModel');
const productModel = require('../model/productModel');
const enquiryModel = require('../model/enquiryModel');
const quotationModel = require('../model/quotationModel');
const salesOrderModel = require('../model/salesOrderModel');
const dispatchModel = require('../model/dispatchModel');
const inventoryModel = require('../model/inventoryModel');

const getStats = async () => {
  const lowStockThreshold = inventoryModel.LOW_STOCK_THRESHOLD ?? 20;

  const [
    customersCount, productsCount, enquiriesCounts, quotationsCounts,
    salesOrdersCounts, dispatchesCount, totalInventoryValue, lowStock, ordersAll, randomProducts,
  ] = await Promise.all([
    customerModel.count(),
    productModel.count(),
    enquiryModel.countByStatus(),
    quotationModel.countByStatus(),
    salesOrderModel.countByStatus(),
    dispatchModel.count(),
    inventoryModel.getTotalAvailableValue(),
    inventoryModel.getLowStockItems(lowStockThreshold),
    salesOrderModel.findAll(),
    productModel.findAll(),
  ]);

  const totalOrderValue = Number(
    (ordersAll || []).reduce((s, o) => s + Number(o.total_amount || 0), 0).toFixed(2)
  );

  const eq = enquiriesCounts || {};
  const qc = quotationsCounts || {};
  const soc = salesOrdersCounts || {};

  return {
    totalCustomers: customersCount || 0,
    totalProducts: productsCount || 0,
    totalDispatches: dispatchesCount || 0,
    totalInventoryValue: +Number(totalInventoryValue || 0).toFixed(2),
    totalOrderValue: totalOrderValue,
    pendingEnquiries: (eq.NEW || 0) + (eq.QUOTED || 0),
    pendingQuotations: (qc.DRAFT || 0) + (qc.SENT || 0),
    pendingOrders: soc.PENDING || 0,
    confirmedOrders: (soc.CONFIRMED || 0) + (soc.DISPATCHED || 0),
    lowStockThreshold,
    enquiryCounts: eq,
    quotationCounts: qc,
    salesOrderCounts: soc,
    lowStockItems: lowStock || [],
    randomProducts: randomProducts || [],
  };
};

module.exports = { getStats };
