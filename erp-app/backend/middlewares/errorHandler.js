const { AppError } = require('../utils/customErrors');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let e = { ...err, message: err.message || 'Internal Server Error', statusCode: err.statusCode || 500 };
  if (err.code === '23505') {
    const d = err.detail || '';
    let msg = 'Duplicate entry: ' + d;
    if (d.includes('quotation_id')) msg = 'Order already exists for this quotation';
    else if (d.includes('email')) msg = 'Email already exists';
    else if (d.includes('product_code')) msg = 'Product code already exists';
    e = new AppError(msg, 409);
  }
  if (err.code === '23503') {
    const d = (err.detail || '').toLowerCase();
    const tbl = (err.table || '').toLowerCase();
    let msg = 'Referenced record not found';
    if (tbl.includes('enquiry')) {
      if (d.includes('customer_id') || d.includes('customer')) msg = 'Referenced customer not found. Please create the customer first.';
      else if (d.includes('product_id') || d.includes('product')) msg = 'Referenced product not found. Please check each line item.';
      else if (d.includes('created_by') || d.includes('users')) msg = 'Invalid authenticated user for created_by reference.';
    } else if (tbl.includes('quotation')) {
      if (d.includes('customer')) msg = 'Referenced customer not found.';
      else if (d.includes('enquiry')) msg = 'Referenced enquiry not found.';
      else if (d.includes('product')) msg = 'Referenced product not found in quotation items.';
    } else if (tbl.includes('sales_order')) {
      if (d.includes('customer')) msg = 'Referenced customer not found.';
      else if (d.includes('quotation')) msg = 'Referenced quotation not found.';
      else if (d.includes('product')) msg = 'Referenced product not found in order items.';
    } else if (tbl.includes('dispatch')) {
      msg = 'Referenced sales order or product not found for dispatch.';
    } else if (tbl.includes('inventory')) {
      msg = 'Referenced product not found for inventory record.';
    } else if (d.includes('customer')) {
      msg = 'Referenced customer not found.';
    } else if (d.includes('product')) {
      msg = 'Referenced product not found.';
    }
    e = new AppError(msg, 400);
  }
  if (err.code === '23514') {
    const c = err.constraint || '';
    if (c.includes('reserved_not_exceed_physical')) e = new AppError('Invalid inventory: reserved + damaged cannot exceed physical', 409);
    else if (c.includes('dispatched_not_exceed_reserved')) e = new AppError('Invalid dispatch: dispatched cannot exceed reserved', 409);
    else e = new AppError('Database constraint violation', 409);
  }
  if (config.nodeEnv === 'development') {
    return res.status(e.statusCode).json({
      data: null,
      error: {
        message: e.message,
        stack: err.stack,
        code: err.code,
        detail: err.detail || null,
        constraint: err.constraint || null,
        table: err.table || null,
      },
    });
  }
  res.status(e.statusCode).json({ data: null, error: { message: e.isOperational ? e.message : 'Something went wrong' } });
};
module.exports = errorHandler;
