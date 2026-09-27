const db = require('../db');
const salesOrderModel = require('../model/salesOrderModel');
const dispatchModel = require('../model/dispatchModel');
const { NotFoundError, ConflictError } = require('../utils/customErrors');

const getAll = () => salesOrderModel.findAll();
const getById = async (id) => {
  const o = await salesOrderModel.findById(id);
  if (!o) throw new NotFoundError('Sales Order not found');
  const items = await salesOrderModel.findItems(id);
  return { ...o, items };
};
const getItems = async (id) => {
  await getById(id);
  return salesOrderModel.findItems(id);
};

const confirmSalesOrder = async (id, userId) => {
  return db.transaction(async (trx) => {
    const so = await trx('sales_orders').where({ id }).forUpdate().first();
    if (!so) throw new NotFoundError('Sales Order not found');
    if (so.status !== 'PENDING') throw new ConflictError(`Sales order is ${so.status}, cannot confirm`);
    const items = await trx('sales_order_items').where({ sales_order_id: id }).forUpdate();
    for (const item of items) {
      const inv = await trx('inventory').where({ product_id: item.product_id }).forUpdate().first();
      if (!inv) throw new NotFoundError('Inventory record missing for product');
      const available = inv.physical_qty - inv.reserved_qty - inv.damaged_qty;
      if (item.quantity > available) {
        throw new ConflictError(`Insufficient stock for product id ${item.product_id}. Available: ${available}, required: ${item.quantity}`);
      }
      await trx('inventory').where({ product_id: item.product_id }).update({
        reserved_qty: inv.reserved_qty + item.quantity,
        updated_at: trx.fn.now(),
      });
      await trx('sales_order_items').where({ id: item.id }).update({ reserved_qty: item.quantity });
    }
    const [updated] = await trx('sales_orders').where({ id }).update({
      status: 'CONFIRMED',
      confirmed_by: userId,
      confirmed_at: trx.fn.now(),
    }).returning('*');
    return salesOrderModel.findById(updated.id);
  });
};

const cancelSalesOrder = async (id) => {
  return db.transaction(async (trx) => {
    const so = await trx('sales_orders').where({ id }).forUpdate().first();
    if (!so) throw new NotFoundError('Sales Order not found');
    if (so.status === 'DISPATCHED') throw new ConflictError('Cannot cancel dispatched sales order');
    if (so.status === 'CANCELLED') return salesOrderModel.findById(id);
    const items = await trx('sales_order_items').where({ sales_order_id: id }).forUpdate();
    for (const item of items) {
      if (item.reserved_qty > 0) {
        const inv = await trx('inventory').where({ product_id: item.product_id }).forUpdate().first();
        if (inv) {
          const nr = Math.max(0, inv.reserved_qty - item.reserved_qty);
          await trx('inventory').where({ product_id: item.product_id }).update({
            reserved_qty: nr,
            updated_at: trx.fn.now(),
          });
        }
      }
      await trx('sales_order_items').where({ id: item.id }).update({ reserved_qty: 0 });
    }
    const [u] = await trx('sales_orders').where({ id }).update({ status: 'CANCELLED' }).returning('*');
    return salesOrderModel.findById(u.id);
  });
};

const createDispatch = async (id, payload, userId) => {
  const { dispatch_date, vehicle_number, driver_name, items } = payload;
  return db.transaction(async (trx) => {
    const so = await trx('sales_orders').where({ id }).forUpdate().first();
    if (!so) throw new NotFoundError('Sales Order not found');
    if (so.status !== 'CONFIRMED') throw new ConflictError(`Sales order is ${so.status}, must be CONFIRMED to dispatch`);
    for (const it of items) {
      const soi = await trx('sales_order_items').where({ id: it.sales_order_item_id, sales_order_id: id }).forUpdate().first();
      if (!soi) throw new NotFoundError('Sales order item not found');
      if (soi.product_id !== it.product_id) throw new ConflictError('Product mismatch on dispatch item');
      const remainToDispatch = soi.reserved_qty - soi.dispatched_qty;
      if (it.quantity > remainToDispatch) {
        throw new ConflictError(`Cannot dispatch ${it.quantity} for item ${it.sales_order_item_id}; ${remainToDispatch} remaining`);
      }
      if (it.quantity < 1) throw new ConflictError('Dispatch quantity must be at least 1');
      const inv = await trx('inventory').where({ product_id: it.product_id }).forUpdate().first();
      if (!inv) throw new NotFoundError('Inventory missing');
      if (inv.physical_qty < it.quantity || inv.reserved_qty < it.quantity) {
        throw new ConflictError(`Inventory inconsistency for product ${it.product_id}`);
      }
      await trx('inventory').where({ product_id: it.product_id }).update({
        physical_qty: inv.physical_qty - it.quantity,
        reserved_qty: inv.reserved_qty - it.quantity,
        updated_at: trx.fn.now(),
      });
      await trx('sales_order_items').where({ id: soi.id }).update({
        dispatched_qty: soi.dispatched_qty + it.quantity,
      });
    }
    const num = await dispatchModel.nextNumber(trx);
    const disp = await dispatchModel.create({
      dispatch_number: num,
      sales_order_id: id,
      dispatch_date: dispatch_date || new Date(),
      vehicle_number,
      driver_name,
      created_by: userId,
    }, items, trx);
    const remainingItems = await trx('sales_order_items').where({ sales_order_id: id });
    const allDone = remainingItems.every((x) => x.dispatched_qty >= x.quantity);
    if (allDone) await trx('sales_orders').where({ id }).update({ status: 'DISPATCHED' });
    return dispatchModel.findById(disp.id);
  });
};

module.exports = { getAll, getById, getItems, confirmSalesOrder, cancelSalesOrder, createDispatch };
