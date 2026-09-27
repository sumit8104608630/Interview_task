const db = require('../db');
const quotationModel = require('../model/quotationModel');
const enquiryModel = require('../model/enquiryModel');
const salesOrderModel = require('../model/salesOrderModel');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/customErrors');
const { calculateGrandTotal } = require('../utils/pricing');

const VALID_TRANSITIONS = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

const getAll = () => quotationModel.findAll();
const getById = async (id) => {
  const q = await quotationModel.findById(id);
  if (!q) throw new NotFoundError('Quotation not found');
  const items = await quotationModel.findItems(id);
  return { ...q, items };
};
const getItems = async (id) => {
  await getById(id);
  return quotationModel.findItems(id);
};
const create = async (d, userId) => {
  const enq = await enquiryModel.findRawById(d.enquiry_id);
  if (!enq) throw new NotFoundError('Enquiry not found');
  const n = await quotationModel.nextNumber();
  const quo = await quotationModel.create(
    {
      quotation_number: n,
      enquiry_id: d.enquiry_id,
      customer_id: d.customer_id,
      valid_until: d.valid_until,
      status: 'DRAFT',
      created_by: userId,
    },
    d.items,
  );
  await enquiryModel.updateStatus(enq.id, 'QUOTED');
  return quotationModel.findById(quo.id);
};
const updateStatus = async (id, status) => {
  const q = await quotationModel.findRawById(id);
  if (!q) throw new NotFoundError('Quotation not found');

  const currentStatus = q.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(status)) {
    throw new ConflictError(`Cannot transition quotation from ${currentStatus} to ${status}`);
  }

  const [u] = await quotationModel.updateStatus(id, status);
  if (!u) throw new NotFoundError('Quotation not found after update');

  if (q.enquiry_id && status === 'ACCEPTED') await enquiryModel.updateStatus(q.enquiry_id, 'WON');
  if (q.enquiry_id && status === 'REJECTED') await enquiryModel.updateStatus(q.enquiry_id, 'LOST');

  return quotationModel.findById(u.id);
};
const convertToSalesOrder = async (id, userId) => {
  try {
    const q = await quotationModel.findRawById(id);
    if (!q) throw new NotFoundError('Quotation not found');
    if (q.status !== 'ACCEPTED') throw new ConflictError('Only ACCEPTED quotations can be converted');
    const items = await quotationModel.findItems(id);
    const orderNumber = await salesOrderModel.nextOrderNumber();
    const so = await salesOrderModel.create(
      {
        order_number: orderNumber,
        quotation_id: q.id,
        customer_id: q.customer_id,
        order_date: new Date(),
        total_amount: calculateGrandTotal(items),
        status: 'PENDING',
        created_by: userId,
      },
      items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    );
    return salesOrderModel.findById(so.id);
  } catch (err) {
    if (err && err.code === '23505') throw new ConflictError('Order already exists for this quotation');
    throw err;
  }
};
module.exports = { getAll, getById, getItems, create, updateStatus, convertToSalesOrder };
