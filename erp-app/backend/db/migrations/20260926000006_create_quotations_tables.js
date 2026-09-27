const up = async (knex) => {
  await knex.schema.raw(`CREATE TYPE quotation_status AS ENUM ('DRAFT','SENT','ACCEPTED','REJECTED')`);
  await knex.schema.createTable('quotations', (t) => {
    t.increments('id').primary();
    t.string('quotation_number', 40).unique().notNullable();
    t.integer('enquiry_id').notNullable().references('id').inTable('enquiries').onDelete('RESTRICT');
    t.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    t.date('valid_until');
    t.specificType('status', 'quotation_status').notNullable().defaultTo('DRAFT');
    t.decimal('grand_total', 14, 2).notNullable().defaultTo(0);
    t.integer('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('quotation_items', (t) => {
    t.increments('id').primary();
    t.integer('quotation_id').notNullable().references('id').inTable('quotations').onDelete('CASCADE');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.integer('quantity').notNullable();
    t.decimal('unit_price', 12, 2).notNullable();
    t.decimal('discount_pct', 5, 2).notNullable().defaultTo(0);
    t.decimal('gst_pct', 5, 2).notNullable().defaultTo(0);
    t.decimal('line_amount', 14, 2).notNullable();
  });
};
const down = async (knex) => {
  await knex.schema.dropTableIfExists('quotation_items');
  await knex.schema.dropTableIfExists('quotations');
  await knex.schema.raw('DROP TYPE IF EXISTS quotation_status');
};
exports.up = up;
exports.down = down;
