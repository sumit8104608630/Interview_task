const enquiryModel = require('../model/enquiryModel');
const { NotFoundError, ConflictError } = require('../utils/customErrors');

const VALID_TRANSITIONS = {
  NEW: ['QUOTED', 'LOST'],
  QUOTED: ['WON', 'LOST'],
  WON: [],
  LOST: [],
};

const getAll = () => enquiryModel.findAll();
const getById = async (id) => {
  const e = await enquiryModel.findById(id);
  if (!e) throw new NotFoundError('Enquiry not found');
  const items = await enquiryModel.findItems(id);
  return { ...e, items };
};
const getItems = async (id) => {
  await getById(id);
  return enquiryModel.findItems(id);
};
const create = async (d, userId) => {
  const n = await enquiryModel.nextNumber();
  const enq = await enquiryModel.create(
    {
      enquiry_number: n,
      customer_id: d.customer_id,
      enquiry_date: d.enquiry_date || new Date(),
      required_date: d.required_date,
      notes: d.notes,
      status: 'NEW',
      created_by: userId,
    },
    d.items,
  );
  return enquiryModel.findById(enq.id);
};
const updateStatus = async (id, status) => {
  const e = await enquiryModel.findRawById(id);
  if (!e) throw new NotFoundError('Enquiry not found');
  const allowed = VALID_TRANSITIONS[e.status] || [];
  if (!allowed.includes(status)) {
    throw new ConflictError(`Cannot transition enquiry from ${e.status} to ${status}`);
  }
  const [updated] = await enquiryModel.updateStatus(id, status);
  return enquiryModel.findById(updated.id);
};
module.exports = { getAll, getById, getItems, create, updateStatus };
