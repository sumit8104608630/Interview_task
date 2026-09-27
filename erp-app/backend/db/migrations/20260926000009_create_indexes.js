const indexes = [
  ['idx_enquiries_customer', 'enquiries', 'customer_id'],
  ['idx_quotations_enquiry', 'quotations', 'enquiry_id'],
  ['idx_orders_customer', 'sales_orders', 'customer_id'],
  ['idx_dispatch_items_soi', 'dispatch_items', 'sales_order_item_id'],
  ['idx_enquiry_items_enquiry', 'enquiry_items', 'enquiry_id'],
  ['idx_quotation_items_quotation', 'quotation_items', 'quotation_id'],
  ['idx_sales_order_items_order', 'sales_order_items', 'sales_order_id'],
  ['idx_dispatches_order', 'dispatches', 'sales_order_id'],
];
exports.up = async (knex) => {
  for (const [name, tbl, col] of indexes) {
    await knex.schema.raw(`CREATE INDEX ${name} ON ${tbl}(${col})`);
  }
};
exports.down = async (knex) => {
  for (const [name] of [...indexes].reverse()) {
    await knex.schema.raw(`DROP INDEX IF EXISTS ${name}`);
  }
};
